import Link from "next/link";
import { appConfig } from "@/lib/config";

const ACCENT = "#5e7cff";
const MONO =
  "'SF Mono', ui-monospace, 'JetBrains Mono', 'Menlo', 'Consolas', monospace";

// ── fake process table data ────────────────────────────────────────────────
type Proc = {
  pid: string;
  agent: string;
  model: string;
  ctx: number;
  state: "RUNNING" | "WAITING" | "BLOCKED";
  arbiter?: boolean;
};

const PROCS: Proc[] = [
  { pid: "0x1a3f", agent: "atlas-scheduler", model: "atlas-core", ctx: 44, state: "RUNNING", arbiter: true },
  { pid: "0x2b07", agent: "refactor-auth", model: "claude", ctx: 78, state: "RUNNING" },
  { pid: "0x2b11", agent: "migrate-schema", model: "claude", ctx: 31, state: "RUNNING" },
  { pid: "0x3c4a", agent: "write-tests", model: "haiku", ctx: 92, state: "WAITING" },
  { pid: "0x3c80", agent: "doc-generator", model: "haiku", ctx: 12, state: "RUNNING" },
  { pid: "0x44d2", agent: "deploy-runner", model: "gpt-4o", ctx: 57, state: "BLOCKED" },
  { pid: "0x51e9", agent: "lint-sweep", model: "haiku", ctx: 8, state: "WAITING" },
  { pid: "0x5a2c", agent: "index-embeddings", model: "embed-3", ctx: 66, state: "RUNNING" },
];

const STATE_COLOR: Record<Proc["state"], string> = {
  RUNNING: "#3ddc84",
  WAITING: "#e3b341",
  BLOCKED: "#f0556a",
};

const SYSCALLS: { call: string; desc: string }[] = [
  { call: "atlas.spawn()", desc: "fork a new agent into the supervised process tree" },
  { call: "atlas.lock(file)", desc: "acquire an exclusive write-lease on a path" },
  { call: "atlas.budget(ctx)", desc: "cap token spend; evict on overflow" },
  { call: "atlas.route(tier)", desc: "dispatch work to the cheapest viable model" },
];

function CtxBar({ value }: { value: number }) {
  const color = value >= 85 ? "#f0556a" : value >= 60 ? "#e3b341" : ACCENT;
  const cells = 16;
  const filled = Math.round((value / 100) * cells);
  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <span className="inline-flex gap-[2px]">
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            className="inline-block h-[9px] w-[5px]"
            style={{
              backgroundColor: i < filled ? color : "#1a1d26",
              boxShadow: i < filled ? `0 0 4px ${color}55` : "none",
            }}
          />
        ))}
      </span>
      <span style={{ color: "#6b7180" }}>{value}%</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#050608] text-[#c2c6d0] selection:bg-[#5e7cff] selection:text-black"
      style={{ fontFamily: MONO, fontSize: "13px" }}
    >
      {/* ══════════════════════════════════════════════════════════════
          TOP STATUS BAR — terminal title bar
      ══════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b border-[#16191f] bg-[#070809]/95 backdrop-blur"
        style={{ boxShadow: "0 1px 0 #000" }}
      >
        <div className="flex items-center justify-between gap-4 px-3 py-1.5 text-[11px] sm:px-4">
          {/* left: identity + online dot */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="flex items-center gap-1.5">
              <span className="hidden sm:flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f0556a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#e3b341]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ddc84]" />
              </span>
            </span>
            <span className="font-bold tracking-[0.2em] text-[#eef0f4]">ATLAS</span>
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-[#3ddc84]"
              style={{ boxShadow: "0 0 7px #3ddc84" }}
            />
            <span className="hidden text-[#3ddc84] sm:inline">SYSTEM NOMINAL</span>
          </div>

          {/* center: fake live telemetry */}
          <div className="hidden items-center gap-3 text-[#5a6070] md:flex">
            <span>UPTIME <span className="text-[#9aa0b0]">99.99%</span></span>
            <span className="text-[#2a2e38]">│</span>
            <span><span className="text-[#9aa0b0]">1.2M</span> PROC/24H</span>
            <span className="text-[#2a2e38]">│</span>
            <span>LOAD <span style={{ color: ACCENT }}>0.42</span></span>
          </div>

          {/* right: auth */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Link
              href="/login"
              className="px-2 py-0.5 text-[#8a90a0] transition-colors hover:text-[#eef0f4]"
            >
              [ sign_in ]
            </Link>
            <Link
              href="/signup"
              className="border px-2 py-0.5 transition-colors hover:bg-[#5e7cff] hover:text-black"
              style={{ borderColor: `${ACCENT}77`, color: ACCENT }}
            >
              get_started ↵
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-3 py-4 sm:px-4">
        {/* ══════════════════════════════════════════════════════════════
            HERO — simulated live console (htop-style)
        ══════════════════════════════════════════════════════════════ */}
        <section
          className="border bg-[#070809]"
          style={{ borderColor: "#181b22" }}
        >
          {/* panel chrome */}
          <div
            className="flex items-center justify-between border-b px-3 py-1.5 text-[11px]"
            style={{ borderColor: "#181b22", color: "#5a6070" }}
          >
            <span>
              <span style={{ color: ACCENT }}>atlas</span>
              <span className="text-[#3a3f4a]">@</span>
              <span className="text-[#9aa0b0]">scheduler</span>
              <span className="text-[#3a3f4a]"> ~ </span>
              <span className="text-[#6b7180]">top --agents --watch</span>
            </span>
            <span className="hidden sm:inline">
              tasks: <span className="text-[#9aa0b0]">8</span> · running{" "}
              <span className="text-[#3ddc84]">5</span> · blocked{" "}
              <span className="text-[#f0556a]">1</span>
            </span>
          </div>

          {/* table header row */}
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div
                className="grid items-center gap-2 border-b px-3 py-1.5 text-[11px] uppercase tracking-wider"
                style={{
                  gridTemplateColumns: "84px 1.4fr 92px 200px 96px",
                  borderColor: "#181b22",
                  background: "#0b0d12",
                  color: "#5a6070",
                }}
              >
                <span>PID</span>
                <span>AGENT</span>
                <span>MODEL</span>
                <span>CTX%</span>
                <span className="text-right">STATE</span>
              </div>

              {/* process rows */}
              {PROCS.map((p) => (
                <div
                  key={p.pid}
                  className="grid items-center gap-2 px-3 py-[7px] text-[12.5px] transition-colors"
                  style={{
                    gridTemplateColumns: "84px 1.4fr 92px 200px 96px",
                    borderBottom: "1px solid #0e1015",
                    background: p.arbiter ? `${ACCENT}14` : "transparent",
                    borderLeft: p.arbiter ? `2px solid ${ACCENT}` : "2px solid transparent",
                  }}
                >
                  <span style={{ color: p.arbiter ? ACCENT : "#6b7180" }}>{p.pid}</span>
                  <span className="flex items-center gap-2 truncate">
                    <span style={{ color: p.arbiter ? "#eef0f4" : "#c2c6d0" }}>
                      {p.agent}
                    </span>
                    {p.arbiter && (
                      <span
                        className="rounded-sm px-1 py-[1px] text-[9px] uppercase tracking-wider"
                        style={{ background: `${ACCENT}33`, color: ACCENT }}
                      >
                        arbiter
                      </span>
                    )}
                  </span>
                  <span className="text-[#8a90a0]">{p.model}</span>
                  <span><CtxBar value={p.ctx} /></span>
                  <span
                    className="text-right text-[11px] font-bold tracking-wider"
                    style={{ color: STATE_COLOR[p.state] }}
                  >
                    {p.state === "BLOCKED" && "■ "}
                    {p.state === "WAITING" && "▮ "}
                    {p.state === "RUNNING" && "▶ "}
                    {p.state}
                  </span>
                </div>
              ))}

              {/* console cursor line */}
              <div className="px-3 py-2 text-[12px] text-[#5a6070]">
                <span style={{ color: ACCENT }}>scheduler</span>
                <span className="text-[#3a3f4a]"> &gt; </span>
                arbitrating write-lease on{" "}
                <span className="text-[#9aa0b0]">src/auth.ts</span>
                <span
                  className="ml-1 inline-block h-[13px] w-[7px] animate-pulse align-middle"
                  style={{ background: ACCENT }}
                />
              </div>
            </div>
          </div>

          {/* the only "headline" — sits UNDER the console, small-ish */}
          <div
            className="border-t px-3 py-5 sm:px-6"
            style={{ borderColor: "#181b22", background: "#08090c" }}
          >
            <p className="text-[20px] leading-snug text-[#eef0f4] sm:text-[26px]">
              Fifty agents. One repo.{" "}
              <span style={{ color: ACCENT }}>Atlas decides who writes.</span>
            </p>
            <p className="mt-1 text-[12px] text-[#6b7180]">
              {appConfig.description}
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SYSCALLS — horizontal strip of terminal commands
        ══════════════════════════════════════════════════════════════ */}
        <section className="mt-4 grid grid-cols-1 border border-[#181b22] sm:grid-cols-2 lg:grid-cols-4">
          {SYSCALLS.map((s, i) => (
            <div
              key={s.call}
              className="border-[#181b22] px-3 py-3"
              style={{
                borderRightWidth: i < SYSCALLS.length - 1 ? 1 : 0,
                borderBottomWidth: 1,
              }}
            >
              <div className="text-[13px]">
                <span style={{ color: ACCENT }}>$ </span>
                <span className="text-[#eef0f4]">{s.call}</span>
              </div>
              <div className="mt-1.5 text-[11px] leading-relaxed text-[#6b7180]">
                {s.desc}
              </div>
            </div>
          ))}
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FILE-ARBITRATION DIAGRAM
        ══════════════════════════════════════════════════════════════ */}
        <section className="mt-4 border border-[#181b22] bg-[#070809]">
          <div
            className="border-b px-3 py-1.5 text-[11px] uppercase tracking-wider"
            style={{ borderColor: "#181b22", color: "#5a6070" }}
          >
            write-lease arbitration · single-writer guarantee
          </div>

          <div className="grid items-stretch gap-0 px-3 py-6 sm:px-6 lg:grid-cols-[1fr_auto_auto_auto_1fr]">
            {/* contending agents */}
            <div className="flex flex-col justify-center gap-2.5">
              {[
                { name: "refactor-auth", pid: "0x2b07", verdict: "APPROVED" as const },
                { name: "write-tests", pid: "0x3c4a", verdict: "QUEUED" as const },
                { name: "deploy-runner", pid: "0x44d2", verdict: "QUEUED" as const },
              ].map((a) => (
                <div
                  key={a.pid}
                  className="flex items-center justify-between gap-3 border px-2.5 py-2"
                  style={{
                    borderColor: a.verdict === "APPROVED" ? `${ACCENT}66` : "#22262f",
                    background: a.verdict === "APPROVED" ? `${ACCENT}10` : "transparent",
                  }}
                >
                  <span>
                    <span className="text-[12px] text-[#dfe2e8]">{a.name}</span>
                    <span className="ml-2 text-[10px] text-[#5a6070]">{a.pid}</span>
                  </span>
                  <span className="text-[#3a3f4a]">→</span>
                </div>
              ))}
            </div>

            {/* arrows in */}
            <div className="hidden items-center justify-center px-3 text-[#3a3f4a] lg:flex">
              <span className="text-lg">⇉</span>
            </div>

            {/* the gate = Atlas */}
            <div className="my-3 flex flex-col items-center justify-center lg:my-0">
              <div
                className="flex h-full min-w-[120px] flex-col items-center justify-center border px-4 py-5"
                style={{
                  borderColor: ACCENT,
                  background: `${ACCENT}0e`,
                  boxShadow: `0 0 28px ${ACCENT}22`,
                }}
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#6b7180]">
                  gate
                </div>
                <div className="mt-1 text-[15px] font-bold text-[#eef0f4]">ATLAS</div>
                <div className="mt-1 text-[10px]" style={{ color: ACCENT }}>
                  mutex::auth
                </div>
              </div>
            </div>

            {/* arrows out */}
            <div className="hidden items-center justify-center px-3 text-[#3a3f4a] lg:flex">
              <span className="text-lg">→</span>
            </div>

            {/* the contested file + verdicts */}
            <div className="flex flex-col justify-center gap-2.5">
              <div
                className="border px-3 py-2.5 text-center"
                style={{ borderColor: `${ACCENT}66`, background: `${ACCENT}10` }}
              >
                <div className="text-[10px] uppercase tracking-wider text-[#5a6070]">
                  contested node
                </div>
                <div className="mt-0.5 text-[14px] text-[#eef0f4]">src/auth.ts</div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] uppercase tracking-wider">
                <div
                  className="border px-1 py-1.5 font-bold"
                  style={{ borderColor: `${ACCENT}66`, color: ACCENT, background: `${ACCENT}12` }}
                >
                  1 approved
                </div>
                <div
                  className="col-span-2 border px-1 py-1.5"
                  style={{ borderColor: "#22262f", color: "#6b7180" }}
                >
                  2 queued · fifo
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            METRICS RIBBON
        ══════════════════════════════════════════════════════════════ */}
        <section className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border border-[#181b22] bg-[#08090c] px-3 py-2.5 text-[11px] text-[#6b7180]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3ddc84]" />
            <span className="text-[#dfe2e8]">0</span> write conflicts in production
          </span>
          <span className="text-[#22262f]">│</span>
          <span>
            <span className="text-[#dfe2e8]">340ms</span> median arbitration
          </span>
          <span className="text-[#22262f]">│</span>
          <span>
            <span style={{ color: ACCENT }}>L4</span> isolation
          </span>
          <span className="text-[#22262f]">│</span>
          <span>
            <span className="text-[#dfe2e8]">8</span> agents supervised · 1 writer
          </span>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER — minimal, black, mono
      ══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#16191f]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-3 py-4 text-[11px] text-[#5a6070] sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span>
            <span className="text-[#9aa0b0]">{appConfig.name}</span>
            <span className="mx-1.5 text-[#2a2e38]">·</span>Singapore 🇸🇬
            <span className="mx-1.5 text-[#2a2e38]">·</span>atlas.sg
          </span>
          <a
            href="https://abduljaleel.xyz/aletheia/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#eef0f4]"
            style={{ color: "#6b7180" }}
          >
            Part of the Aletheia stack ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
