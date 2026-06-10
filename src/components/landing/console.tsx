"use client";

import { useEffect, useRef, useState } from "react";

const ACCENT = "#5e7cff";

type ProcState = "RUNNING" | "WAITING" | "BLOCKED";

type Proc = {
  pid: string;
  agent: string;
  model: string;
  ctx: number;
  state: ProcState;
  arbiter?: boolean;
};

const INITIAL_PROCS: Proc[] = [
  { pid: "0x1a3f", agent: "atlas-scheduler", model: "atlas-core", ctx: 44, state: "RUNNING", arbiter: true },
  { pid: "0x2b07", agent: "refactor-auth", model: "claude", ctx: 78, state: "RUNNING" },
  { pid: "0x2b11", agent: "migrate-schema", model: "claude", ctx: 31, state: "RUNNING" },
  { pid: "0x3c4a", agent: "write-tests", model: "haiku", ctx: 92, state: "WAITING" },
  { pid: "0x3c80", agent: "doc-generator", model: "haiku", ctx: 12, state: "RUNNING" },
  { pid: "0x44d2", agent: "deploy-runner", model: "gpt-4o", ctx: 57, state: "BLOCKED" },
  { pid: "0x51e9", agent: "lint-sweep", model: "haiku", ctx: 8, state: "WAITING" },
  { pid: "0x5a2c", agent: "index-embeddings", model: "embed-3", ctx: 66, state: "RUNNING" },
];

const STATE_COLOR: Record<ProcState, string> = {
  RUNNING: "#3ddc84",
  WAITING: "#e3b341",
  BLOCKED: "#f0556a",
};

const STATE_GLYPH: Record<ProcState, string> = {
  RUNNING: "▶",
  WAITING: "▮",
  BLOCKED: "■",
};

const SCHEDULER_MSGS: { full: string; short: string }[] = [
  { full: "arbitrating write-lease on src/auth.ts", short: "arbitrating · src/auth.ts" },
  { full: "granted 0x2b07 → src/auth.ts · queue depth 2", short: "granted 0x2b07 · queue 2" },
  { full: "evicting 0x3c4a · ctx 92% > budget", short: "evicting 0x3c4a · ctx 92%" },
  { full: "routing lint-sweep → haiku · tier-3 viable", short: "routing → haiku · tier-3" },
  { full: "checkpoint ok · 8 procs · 0 write conflicts", short: "checkpoint · 0 conflicts" },
];

const TICK_MS = 2400;
const TYPE_MS = 42;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function driftProcs(prev: Proc[], flipState: boolean): Proc[] {
  let next = prev.map((p) => ({
    ...p,
    ctx: clamp(
      p.ctx + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 4)),
      4,
      97
    ),
  }));

  if (flipState) {
    const candidates = next
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => !p.arbiter);
    const waiting = candidates.filter(({ p }) => p.state === "WAITING");
    const running = candidates.filter(({ p }) => p.state === "RUNNING");
    const blocked = candidates.filter(({ p }) => p.state === "BLOCKED");

    let target: { p: Proc; i: number } | undefined;
    let newState: ProcState | undefined;
    if (waiting.length > 0 && Math.random() < 0.6) {
      target = pick(waiting);
      newState = "RUNNING";
    } else if (running.length > 1) {
      target = pick(running);
      newState = "WAITING";
    } else if (blocked.length > 0) {
      target = pick(blocked);
      newState = "WAITING";
    }
    if (target && newState) {
      const idx = target.i;
      const ns: ProcState = newState;
      next = next.map((p, i) => (i === idx ? { ...p, state: ns } : p));
    }
  }
  return next;
}

function CtxBar({ value }: { value: number }) {
  const color = value >= 85 ? "#f0556a" : value >= 60 ? "#e3b341" : ACCENT;
  const cells = (count: number, className: string) => {
    const filled = Math.round((value / 100) * count);
    return (
      <span className={className} aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="ctx-cell inline-block h-[9px] w-[5px]"
            style={{
              backgroundColor: i < filled ? color : "#1a1d26",
              boxShadow: i < filled ? `0 0 4px ${color}55` : "none",
            }}
          />
        ))}
      </span>
    );
  };
  return (
    <span className="inline-flex items-center gap-2 align-middle">
      {cells(8, "inline-flex gap-[2px] sm:hidden")}
      {cells(16, "hidden gap-[2px] sm:inline-flex")}
      <span className="tabular-nums text-[#8a90a0]">{value}%</span>
    </span>
  );
}

export function LiveConsole() {
  const [procs, setProcs] = useState<Proc[]>(INITIAL_PROCS);
  const [msgIndex, setMsgIndex] = useState(0);
  const [typed, setTyped] = useState(SCHEDULER_MSGS[0].full.length);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [narrow, setNarrow] = useState(false);
  const tickRef = useRef(0);

  // Detect prefers-reduced-motion and narrow viewport after mount
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia("(max-width: 639px)");
    setReduced(motionQuery.matches);
    setNarrow(widthQuery.matches);
    const onMotion = (e: MediaQueryListEvent) => setReduced(e.matches);
    const onWidth = (e: MediaQueryListEvent) => setNarrow(e.matches);
    motionQuery.addEventListener("change", onMotion);
    widthQuery.addEventListener("change", onWidth);
    return () => {
      motionQuery.removeEventListener("change", onMotion);
      widthQuery.removeEventListener("change", onWidth);
    };
  }, []);

  // CTX drift + occasional state transitions
  useEffect(() => {
    if (reduced !== false) return;
    const id = setInterval(() => {
      tickRef.current += 1;
      const flip = tickRef.current % 2 === 0;
      setProcs((prev) => driftProcs(prev, flip));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [reduced]);

  // Scheduler line: type out messages character by character, then cycle
  useEffect(() => {
    if (reduced !== false) return;
    const msg = narrow
      ? SCHEDULER_MSGS[msgIndex].short
      : SCHEDULER_MSGS[msgIndex].full;
    if (typed < msg.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setMsgIndex((i) => (i + 1) % SCHEDULER_MSGS.length);
      setTyped(0);
    }, 2600);
    return () => clearTimeout(t);
  }, [typed, msgIndex, reduced, narrow]);

  const message = narrow
    ? SCHEDULER_MSGS[msgIndex].short
    : SCHEDULER_MSGS[msgIndex].full;
  const runningCount = procs.filter((p) => p.state === "RUNNING").length;
  const blockedCount = procs.filter((p) => p.state === "BLOCKED").length;

  return (
    <>
      {/* panel chrome */}
      <div
        className="flex items-center justify-between gap-3 border-b border-[#181b22] px-3 py-1.5 text-[11px] text-[#7d8494]"
      >
        <span className="truncate">
          <span style={{ color: ACCENT }}>atlas</span>
          <span className="text-[#3a3f4a]" aria-hidden="true">@</span>
          <span className="text-[#9aa0b0]">scheduler</span>
          <span className="text-[#3a3f4a]" aria-hidden="true"> ~ </span>
          <span className="text-[#8a90a0]">top --agents --watch</span>
          <span className="text-[#3a3f4a]" aria-hidden="true"> · </span>
          <span className="text-[#7d8494]">simulated feed</span>
        </span>
        <span className="hidden whitespace-nowrap sm:inline">
          tasks: <span className="text-[#9aa0b0]">{procs.length}</span> · running{" "}
          <span className="text-[#3ddc84]">{runningCount}</span> · blocked{" "}
          <span className="text-[#f0556a]">{blockedCount}</span>
        </span>
      </div>

      {/* process table */}
      <div role="table" aria-label="Agent process table — simulated demo feed">
        {/* header row */}
        <div
          role="row"
          className="proc-grid border-b border-[#181b22] bg-[#0b0d12] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#7d8494]"
        >
          <span role="columnheader">PID</span>
          <span role="columnheader">AGENT</span>
          <span role="columnheader" className="hidden sm:block">
            MODEL
          </span>
          <span role="columnheader">CTX%</span>
          <span role="columnheader" className="text-right">
            STATE
          </span>
        </div>

        {/* process rows */}
        {procs.map((p) => (
          <div
            key={p.pid}
            role="row"
            className={`proc-grid proc-row px-3 py-[7px] text-[12.5px] ${
              p.arbiter ? "proc-row-arb" : ""
            }`}
          >
            <span role="cell" className="proc-pid">
              {p.pid}
            </span>
            <span role="cell" className="flex min-w-0 items-center gap-2">
              <span
                className="truncate"
                style={{ color: p.arbiter ? "#eef0f4" : "#c2c6d0" }}
              >
                {p.agent}
              </span>
              {p.arbiter && (
                <span
                  className="shrink-0 rounded-sm px-1 py-[1px] text-[9px] uppercase tracking-wider"
                  style={{ background: `${ACCENT}33`, color: ACCENT }}
                >
                  <span className="sm:hidden">arb</span>
                  <span className="hidden sm:inline">arbiter</span>
                </span>
              )}
            </span>
            <span role="cell" className="hidden text-[#8a90a0] sm:block">
              {p.model}
            </span>
            <span role="cell">
              <CtxBar value={p.ctx} />
            </span>
            <span
              role="cell"
              className="text-right text-[11px] font-bold tracking-wider"
              style={{ color: STATE_COLOR[p.state] }}
            >
              <span aria-hidden="true">{STATE_GLYPH[p.state]} </span>
              {p.state}
            </span>
          </div>
        ))}
      </div>

      {/* console cursor line */}
      <div className="px-3 py-2 text-[12px] text-[#7d8494]">
        <span style={{ color: ACCENT }}>scheduler</span>
        <span className="text-[#3a3f4a]" aria-hidden="true">
          {" "}
          &gt;{" "}
        </span>
        <span>{message.slice(0, typed)}</span>
        <span
          className="atlas-cursor ml-1 inline-block h-[13px] w-[7px] align-middle"
          style={{ background: ACCENT }}
          aria-hidden="true"
        />
      </div>
    </>
  );
}

export function LoadTicker() {
  const [load, setLoad] = useState(0.42);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setLoad((prev) =>
        clamp(
          prev + (Math.random() < 0.5 ? -1 : 1) * (0.01 + Math.random() * 0.05),
          0.18,
          0.74
        )
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return <span style={{ color: ACCENT }}>{load.toFixed(2)}</span>;
}

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <span
        className="text-[26px] font-bold text-[#eef0f4] sm:text-[34px]"
        style={{ letterSpacing: "-0.01em" }}
      >
        <span style={{ color: ACCENT }}>$ </span>
        {command}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="inline-flex min-h-[44px] cursor-pointer items-center text-[12px] transition-colors"
        style={{ color: copied ? "#3ddc84" : "#8a90a0" }}
      >
        {copied ? "[ copied ✓ ]" : "[ copy ]"}
      </button>
    </div>
  );
}
