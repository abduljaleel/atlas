import Link from "next/link";
import { appConfig } from "@/lib/config";

const ACCENT = "#5e7cff";

export default function LandingPage() {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#08090d] text-[#d4d4d8]"
      style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}
    >
      {/* ──────────────────────────────────────────────────────────────
          NAV
      ────────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#16181d]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
            />
            <span
              className="text-base tracking-wide text-[#fafafa]"
              style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif", fontWeight: 600 }}
            >
              Atlas
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.25em] text-[#52525b] hidden sm:inline"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
            >
              · Singapore
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs text-[#71717a] hover:text-[#fafafa] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
            >
              sign in
            </Link>
            <Link
              href="/signup"
              className="text-xs border px-4 py-1.5 transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
                borderColor: `${ACCENT}66`,
                color: ACCENT,
              }}
            >
              get started
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────
          HERO
      ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-28 pb-16 text-center">
        <div className="flex items-center gap-2 mb-10">
          <span
            className="inline-block h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }}
          />
          <span
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: ACCENT, fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
          >
            Governance Layer · System Online
          </span>
        </div>

        <h1
          className="text-7xl sm:text-8xl lg:text-[10rem] tracking-tight text-white leading-none"
          style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif", fontWeight: 500 }}
        >
          Atlas
        </h1>

        <p className="mt-8 max-w-2xl text-xl sm:text-2xl text-[#d4d4d8] leading-snug">
          OS-level process manager for autonomous agents.
        </p>
        <p
          className="mt-6 text-sm text-[#71717a]"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
        >
          From Singapore — the port that routes the world.
        </p>

        <div
          className="mt-10 inline-block border-l-2 pl-4 py-1 text-left text-sm text-[#a1a1aa] max-w-md"
          style={{ borderColor: `${ACCENT}80` }}
        >
          &ldquo;Fifty agents touching one repo. Who arbitrates?&rdquo;
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          PROCESS TREE — root + 5 fanning out
      ────────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#16181d]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: ACCENT }}
              />
              <span
                className="text-[10px] uppercase tracking-[0.25em] text-[#71717a]"
                style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
              >
                /proc — active agent tree
              </span>
            </div>
            <span
              className="text-[10px] uppercase tracking-[0.25em] text-[#52525b]"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
            >
              tick 0x3a91
            </span>
          </div>

          <div className="rounded-md border border-[#16181d] bg-[#0a0c11] p-6 sm:p-10">
            {/* Tree visualization with SVG connectors */}
            <div className="relative">
              {/* Root node */}
              <div className="flex justify-center mb-12">
                <div
                  className="rounded-md border bg-[#0e1118] px-5 py-3 min-w-[240px]"
                  style={{ borderColor: ACCENT, boxShadow: `0 0 24px ${ACCENT}30` }}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: ACCENT, fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
                    >
                      ROOT · PID 0x00
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-sm"
                      style={{
                        background: `${ACCENT}22`,
                        color: ACCENT,
                        fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
                      }}
                    >
                      arbiter
                    </span>
                  </div>
                  <div className="text-sm text-white">orchestrator.main</div>
                  <div
                    className="mt-2 flex items-center gap-2 text-[10px] text-[#71717a]"
                    style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
                  >
                    <span>ctx</span>
                    <div className="flex-1 h-1 bg-[#16181d] rounded-sm overflow-hidden">
                      <div className="h-full" style={{ width: "32%", background: ACCENT }} />
                    </div>
                    <span>32 / 100</span>
                  </div>
                </div>
              </div>

              {/* Connector lines (SVG) */}
              <svg
                className="absolute left-0 right-0 mx-auto pointer-events-none"
                width="100%"
                height="60"
                style={{ top: "85px" }}
                viewBox="0 0 800 60"
                preserveAspectRatio="none"
              >
                <line x1="400" y1="0" x2="80" y2="60" stroke={`${ACCENT}60`} strokeWidth="1" />
                <line x1="400" y1="0" x2="240" y2="60" stroke={`${ACCENT}60`} strokeWidth="1" />
                <line x1="400" y1="0" x2="400" y2="60" stroke={`${ACCENT}60`} strokeWidth="1" />
                <line x1="400" y1="0" x2="560" y2="60" stroke={`${ACCENT}60`} strokeWidth="1" />
                <line x1="400" y1="0" x2="720" y2="60" stroke={`${ACCENT}60`} strokeWidth="1" />
              </svg>

              {/* Child nodes — 5 fanning out */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
                {[
                  { pid: "0x01", name: "schema.migrate", status: "running", color: "#22c55e", ctx: 18, lock: "db/schema.sql" },
                  { pid: "0x02", name: "test.runner", status: "running", color: "#22c55e", ctx: 41, lock: "tests/*" },
                  { pid: "0x03", name: "build.compile", status: "waiting", color: "#eab308", ctx: 67, lock: "queued" },
                  { pid: "0x04", name: "deploy.prepare", status: "blocked", color: "#ef4444", ctx: 12, lock: "waits 0x01" },
                  { pid: "0x05", name: "docs.update", status: "running", color: "#22c55e", ctx: 23, lock: "README.md" },
                ].map((p) => (
                  <div
                    key={p.pid}
                    className="rounded-md border border-[#16181d] bg-[#0e1118] p-3 hover:border-[#5e7cff]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[9px] uppercase tracking-[0.15em] text-[#71717a]"
                        style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
                      >
                        PID {p.pid}
                      </span>
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }}
                      />
                    </div>
                    <div
                      className="text-xs text-white mb-2 truncate"
                      style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
                    >
                      {p.name}
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-[9px] text-[#71717a]"
                      style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
                    >
                      <div className="flex-1 h-1 bg-[#16181d] rounded-sm overflow-hidden">
                        <div className="h-full" style={{ width: `${p.ctx}%`, background: p.color }} />
                      </div>
                      <span>{p.ctx}%</span>
                    </div>
                    <div
                      className="mt-2 text-[9px] text-[#52525b] truncate"
                      style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
                      title={p.lock}
                    >
                      &gt; {p.lock}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          CAPABILITIES — 4 cards with monospace command headers
      ────────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#16181d]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p
            className="text-[10px] uppercase tracking-[0.3em] text-[#71717a] mb-10 text-center"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
          >
            Four primitives
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                cmd: "atlas.spawn()",
                label: "Process arbitration",
                desc: "One orchestrator. Many agents. Atlas decides who runs when, and who must wait.",
              },
              {
                cmd: "atlas.lock()",
                label: "File-level locking",
                desc: "Two agents cannot edit one file at once. Atlas enforces it at the filesystem boundary.",
              },
              {
                cmd: "atlas.budget()",
                label: "Context budgets",
                desc: "Every agent has a token ceiling. Atlas evicts, summarizes, or refuses on overflow.",
              },
              {
                cmd: "atlas.route()",
                label: "Tier routing",
                desc: "Cheap models for grep, frontier models for design. Routed by intent, not by hand.",
              },
            ].map((f) => (
              <div
                key={f.cmd}
                className="border border-[#16181d] bg-[#0a0c11] p-5 hover:border-[#5e7cff]/40 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#52525b]" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}>
                    &gt;
                  </span>
                  <span
                    className="text-sm group-hover:text-white transition-colors"
                    style={{ color: ACCENT, fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
                  >
                    {f.cmd}
                  </span>
                </div>
                <div className="text-white text-sm font-medium mb-2">{f.label}</div>
                <div className="text-xs text-[#71717a] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          STATS
      ────────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#16181d]" style={{ background: "#06070a" }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2 text-center md:text-left">
            <div>
              <div
                className="text-5xl sm:text-6xl text-white tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif", fontWeight: 500 }}
              >
                1.2M
              </div>
              <div
                className="mt-3 text-xs uppercase tracking-[0.25em] text-[#71717a]"
                style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
              >
                agent-hours arbitrated
              </div>
            </div>
            <div>
              <div
                className="text-5xl sm:text-6xl text-white tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif", fontWeight: 500 }}
              >
                <span style={{ color: ACCENT }}>0</span>
              </div>
              <div
                className="mt-3 text-xs uppercase tracking-[0.25em] text-[#71717a]"
                style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
              >
                file conflicts in production
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          CTA + ALETHEIA LINK
      ────────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#16181d]">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <p
            className="text-[10px] uppercase tracking-[0.3em] text-[#71717a] mb-6"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
          >
            Run the orchestrator
          </p>
          <Link
            href="/signup"
            className="inline-block border px-8 py-3 text-sm transition-all duration-200 hover:bg-opacity-10"
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
              borderColor: ACCENT,
              color: ACCENT,
              boxShadow: `0 0 20px ${ACCENT}30`,
            }}
          >
            $ atlas init →
          </Link>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#16181d]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="text-xs text-[#52525b]"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
          >
            <span
              className="text-[#a1a1aa]"
              style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif", fontWeight: 600, fontSize: "0.9rem" }}
            >
              {appConfig.name}
            </span>
            <span className="mx-2">·</span>
            <span>Singapore</span>
            <span className="mx-2">·</span>
            <span>atlas.sg</span>
          </div>
          <a
            href="https://abduljaleel.xyz/aletheia/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] px-3 py-1.5 border transition-colors hover:bg-opacity-10"
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
              borderColor: `${ACCENT}40`,
              color: ACCENT,
            }}
          >
            Part of the Aletheia stack ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
