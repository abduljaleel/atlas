import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#08090d] px-6 text-[#d4d4d8]">
      <div className="mx-auto max-w-md text-center">
        <p
          className="mb-6 text-xs uppercase tracking-[0.25em] text-[#52525b]"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
        >
          404 · Atlas · Singapore
        </p>
        <h1
          className="mb-6 text-6xl font-light tracking-tight text-[#fafafa]"
          style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif" }}
        >
          Page not found
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-[#71717a]">
          The page you&rsquo;re looking for doesn&rsquo;t exist on Atlas.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="border px-6 py-3 text-xs uppercase tracking-[0.15em] transition-colors hover:text-[#fafafa]"
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
              borderColor: "#5e7cff66",
              color: "#5e7cff",
            }}
          >
            ← Back to Atlas
          </Link>
          <a
            href="https://abduljaleel.xyz/aletheia/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-[#fafafa]"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
          >
            visit Aletheia ↗
          </a>
        </div>
      </div>
    </main>
  );
}
