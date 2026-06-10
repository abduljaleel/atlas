import Link from "next/link";
import { appConfig } from "@/lib/config";
import { LiveConsole, LoadTicker, CopyCommand } from "@/components/landing/console";

const ACCENT = "#5e7cff";
const BORDER = "#181b22";
const MONO =
  "'SF Mono', ui-monospace, 'JetBrains Mono', 'Menlo', 'Consolas', monospace";

const SYSCALLS: { call: string; desc: string; ret: string }[] = [
  {
    call: "atlas.spawn()",
    desc: "fork a new agent into the supervised process tree",
    ret: "pid 0x6b1e spawned · attached",
  },
  {
    call: "atlas.lock(file)",
    desc: "acquire an exclusive write-lease on a path",
    ret: "lease granted · ttl 120s",
  },
  {
    call: "atlas.budget(ctx)",
    desc: "cap token spend; evict on overflow",
    ret: "0x3c4a evicted at 92% ctx",
  },
  {
    call: "atlas.route(tier)",
    desc: "dispatch work to the cheapest viable model",
    ret: "haiku · $0.0004/req",
  },
];

const CONTENDERS = [
  { name: "refactor-auth", pid: "0x2b07", verdict: "APPROVED" as const },
  { name: "write-tests", pid: "0x3c4a", verdict: "QUEUED" as const },
  { name: "deploy-runner", pid: "0x44d2", verdict: "QUEUED" as const },
];

function FlowConnector() {
  return (
    <div
      className="flex items-center justify-center py-1.5 lg:px-3 lg:py-0"
      aria-hidden="true"
    >
      <span className="text-[14px] text-[#7d8494] lg:hidden">↓</span>
      <span className="relative hidden h-px w-10 overflow-hidden bg-[#2a2e38] lg:block">
        <span
          className="atlas-flow absolute left-0 top-0 h-px w-4"
          style={{ background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
        />
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#050608] text-[#c2c6d0] selection:bg-[#5e7cff] selection:text-black"
      style={{ fontFamily: MONO, fontSize: "13px" }}
    >
      <style>{`
        @keyframes atlas-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .atlas-cursor { animation: atlas-blink 1.1s steps(2, jump-none) infinite; }
        @keyframes atlas-flow {
          0% { transform: translateX(-16px); }
          100% { transform: translateX(40px); }
        }
        .atlas-flow { animation: atlas-flow 1.5s linear infinite; }
        .proc-grid {
          display: grid;
          align-items: center;
          gap: 6px;
          grid-template-columns: 56px minmax(0, 1fr) 92px 72px;
        }
        @media (min-width: 640px) {
          .proc-grid {
            gap: 8px;
            grid-template-columns: 84px minmax(0, 1.4fr) 92px 200px 96px;
          }
        }
        .proc-row {
          border-bottom: 1px solid #0e1015;
          border-left: 2px solid transparent;
          transition: background-color 0.15s ease;
        }
        .proc-row:hover { background-color: #0d1018; }
        .proc-pid { color: #8a90a0; transition: color 0.15s ease; }
        .proc-row:hover .proc-pid { color: ${ACCENT}; }
        .proc-row-arb {
          background-color: rgba(94, 124, 255, 0.08);
          border-left-color: ${ACCENT};
        }
        .proc-row-arb .proc-pid { color: ${ACCENT}; }
        .proc-row-arb:hover { background-color: rgba(94, 124, 255, 0.14); }
        .ctx-cell { transition: background-color 0.6s ease, box-shadow 0.6s ease; }
        .syscall-prompt { color: ${ACCENT}; transition: color 0.15s ease, text-shadow 0.15s ease; }
        .syscall-card:hover .syscall-prompt { color: #9db1ff; text-shadow: 0 0 8px ${ACCENT}66; }
        .syscall-ret { opacity: 0; transition: opacity 0.18s ease; }
        .syscall-card:hover .syscall-ret { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .atlas-cursor, .atlas-flow { animation: none !important; }
          .proc-row, .proc-pid, .ctx-cell, .syscall-prompt, .syscall-ret { transition: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          TOP STATUS BAR — terminal title bar
      ══════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b bg-[#070809]/95 backdrop-blur"
        style={{ borderColor: BORDER, boxShadow: "0 1px 0 #000" }}
      >
        <div className="flex items-center justify-between gap-4 px-3 py-1.5 text-[11px] sm:px-4">
          {/* left: identity + online dot */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="hidden gap-1.5 sm:flex" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f0556a]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#e3b341]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3ddc84]" />
            </span>
            <span className="font-bold tracking-[0.2em] text-[#eef0f4]">ATLAS</span>
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-[#3ddc84] motion-reduce:animate-none"
              style={{ boxShadow: "0 0 7px #3ddc84" }}
              aria-hidden="true"
            />
            <span className="hidden text-[#3ddc84] sm:inline">SYSTEM NOMINAL</span>
          </div>

          {/* center: simulated telemetry */}
          <div className="hidden items-center gap-3 text-[#7d8494] md:flex">
            <span>UPTIME <span className="text-[#9aa0b0]">99.99%</span></span>
            <span className="text-[#2a2e38]" aria-hidden="true">│</span>
            <span><span className="text-[#9aa0b0]">1.2M</span> PROC/24H</span>
            <span className="text-[#2a2e38]" aria-hidden="true">│</span>
            <span>LOAD <LoadTicker /></span>
          </div>

          {/* right: auth */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center px-2 text-[#8a90a0] transition-colors hover:text-[#eef0f4] sm:min-h-0 sm:py-0.5"
            >
              [ sign_in ]
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[44px] items-center border px-2 transition-colors hover:bg-[#5e7cff] hover:text-black sm:min-h-0 sm:py-0.5"
              style={{ borderColor: `${ACCENT}77`, color: ACCENT }}
            >
              get_started ↵
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-3 py-4 sm:px-4">
        {/* ══════════════════════════════════════════════════════════════
            HERO — live console (htop-style)
        ══════════════════════════════════════════════════════════════ */}
        <section className="border bg-[#070809]" style={{ borderColor: BORDER }}>
          <h2 className="sr-only">Live agent console — simulated demo feed</h2>
          <LiveConsole />

          {/* the headline — sits UNDER the console */}
          <div
            className="border-t px-4 py-8 sm:px-6 sm:py-10"
            style={{ borderColor: BORDER, background: "#08090c" }}
          >
            <h1
              className="text-[34px] font-bold leading-[1.15] text-[#eef0f4] sm:text-[44px]"
              style={{ letterSpacing: "-0.01em" }}
            >
              <span className="text-[#3a3f4a]" aria-hidden="true"># </span>
              Fifty agents. One repo.{" "}
              <span style={{ color: ACCENT }}>Atlas decides who writes.</span>
            </h1>
            <p className="mt-3 text-[14px] text-[#8a90a0]">
              {appConfig.description}
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SYSCALLS — horizontal strip of terminal commands
        ══════════════════════════════════════════════════════════════ */}
        <section
          className="mt-4 grid grid-cols-1 border-l border-t sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderColor: BORDER }}
        >
          <h2 className="sr-only">The Atlas syscall surface</h2>
          {SYSCALLS.map((s) => (
            <div
              key={s.call}
              className="syscall-card border-b border-r px-3 py-3"
              style={{ borderColor: BORDER }}
            >
              <div className="text-[13px]">
                <span className="syscall-prompt">$ </span>
                <span className="text-[#eef0f4]">{s.call}</span>
              </div>
              <div className="mt-1.5 text-[11px] leading-relaxed text-[#8a90a0]">
                {s.desc}
              </div>
              <div className="mt-1.5 h-[16px] text-[11px]">
                <span className="syscall-ret text-[#7d8494]">
                  <span style={{ color: ACCENT }} aria-hidden="true">
                    →{" "}
                  </span>
                  {s.ret}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FILE-ARBITRATION DIAGRAM
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="arbitration"
          className="mt-4 border bg-[#070809]"
          style={{ borderColor: BORDER }}
        >
          <h2
            className="border-b px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#7d8494]"
            style={{ borderColor: BORDER }}
          >
            write-lease arbitration · single-writer guarantee
          </h2>

          <div className="grid items-stretch gap-0 px-3 py-6 sm:px-6 lg:grid-cols-[1fr_auto_auto_auto_1fr]">
            {/* contending agents */}
            <div className="flex flex-col justify-center gap-2.5">
              {CONTENDERS.map((a) => (
                <div
                  key={a.pid}
                  className="flex items-center justify-between gap-3 border px-2.5 py-2"
                  style={{
                    borderColor: a.verdict === "APPROVED" ? `${ACCENT}66` : BORDER,
                    background:
                      a.verdict === "APPROVED" ? `${ACCENT}10` : "transparent",
                  }}
                >
                  <span>
                    <span className="text-[12px] text-[#dfe2e8]">{a.name}</span>
                    <span className="ml-2 text-[10px] text-[#7d8494]">
                      {a.pid}
                    </span>
                  </span>
                  <span className="text-[#3a3f4a]" aria-hidden="true">
                    <span className="hidden lg:inline">→</span>
                    <span className="lg:hidden">↓</span>
                  </span>
                </div>
              ))}
            </div>

            {/* connector: agents → gate */}
            <FlowConnector />

            {/* the gate = Atlas */}
            <div className="flex flex-col items-center justify-center">
              <div
                className="flex h-full min-w-[120px] flex-col items-center justify-center border px-4 py-5"
                style={{
                  borderColor: ACCENT,
                  background: `${ACCENT}0e`,
                  boxShadow: `0 0 28px ${ACCENT}22`,
                }}
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#7d8494]">
                  gate
                </div>
                <div className="mt-1 text-[15px] font-bold text-[#eef0f4]">
                  ATLAS
                </div>
                <div className="mt-1 text-[10px]" style={{ color: ACCENT }}>
                  mutex::auth
                </div>
              </div>
            </div>

            {/* connector: gate → contested file */}
            <FlowConnector />

            {/* the contested file + verdicts */}
            <div className="flex flex-col justify-center gap-2.5">
              <div
                className="border px-3 py-2.5 text-center"
                style={{ borderColor: `${ACCENT}66`, background: `${ACCENT}10` }}
              >
                <div className="text-[10px] uppercase tracking-wider text-[#7d8494]">
                  contested node
                </div>
                <div className="mt-0.5 text-[14px] text-[#eef0f4]">
                  src/auth.ts
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] uppercase tracking-wider">
                <div
                  className="border px-1 py-1.5 font-bold"
                  style={{
                    borderColor: `${ACCENT}66`,
                    color: ACCENT,
                    background: `${ACCENT}12`,
                  }}
                >
                  1 approved
                </div>
                <div
                  className="col-span-2 border px-1 py-1.5 text-[#8a90a0]"
                  style={{ borderColor: BORDER }}
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
        <section
          className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border bg-[#08090c] px-3 py-2.5 text-[11px] text-[#8a90a0]"
          style={{ borderColor: BORDER }}
        >
          <h2 className="sr-only">Telemetry</h2>
          {[
            <span key="conflicts" className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#3ddc84]"
                aria-hidden="true"
              />
              <span>
                <span className="text-[#dfe2e8]">0</span> write conflicts in
                production
              </span>
            </span>,
            <span key="arbitration">
              <span className="text-[#dfe2e8]">340ms</span> median arbitration
            </span>,
            <span key="isolation">
              <span style={{ color: ACCENT }}>L4</span> isolation
            </span>,
            <span key="supervised">
              <span className="text-[#dfe2e8]">8</span> agents supervised · 1
              writer
            </span>,
          ].map((item, i) => (
            <span key={i} className="flex items-center whitespace-nowrap">
              {i > 0 && (
                <span className="pr-5 text-[#2a2e38]" aria-hidden="true">
                  │
                </span>
              )}
              {item}
            </span>
          ))}
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CLOSING CTA — terminal-native
        ══════════════════════════════════════════════════════════════ */}
        <section className="mt-4 border bg-[#070809]" style={{ borderColor: BORDER }}>
          <h2 className="sr-only">Get started with Atlas</h2>
          <div
            className="border-b px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#7d8494]"
            style={{ borderColor: BORDER }}
          >
            boot the arbiter
          </div>
          <div className="flex flex-col items-start gap-5 px-4 py-10 sm:items-center sm:px-6 sm:py-14">
            <CopyCommand command="atlas init" />
            <p className="text-[12px] text-[#8a90a0] sm:text-center">
              one binary · attach your agents · Atlas holds the write-lock from
              there
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="inline-flex min-h-[44px] items-center justify-center border px-6 text-[13px] font-bold transition-colors hover:bg-[#5e7cff] hover:text-black"
                style={{ borderColor: `${ACCENT}77`, color: ACCENT }}
              >
                get_started ↵
              </Link>
              <Link
                href="#arbitration"
                className="inline-flex min-h-[44px] items-center justify-center px-6 text-[13px] text-[#8a90a0] transition-colors hover:text-[#eef0f4]"
              >
                [ read_docs ]
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER — minimal, black, mono, pinned to viewport bottom
      ══════════════════════════════════════════════════════════════ */}
      <footer className="border-t" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-3 py-4 text-[11px] text-[#7d8494] sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span>
            <span className="text-[#9aa0b0]">{appConfig.name}</span>
            <span className="mx-1.5 text-[#2a2e38]" aria-hidden="true">·</span>
            Singapore 🇸🇬
            <span className="mx-1.5 text-[#2a2e38]" aria-hidden="true">·</span>
            atlas.sg
          </span>
          <a
            href="https://abduljaleel.xyz/aletheia/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8a90a0] transition-colors hover:text-[#eef0f4]"
          >
            Part of the Aletheia stack ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
