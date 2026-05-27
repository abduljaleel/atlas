"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console — wire to your monitoring service of choice
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#08090d] px-6 text-[#d4d4d8]">
      <div className="mx-auto max-w-md text-center">
        <p
          className="mb-6 text-xs uppercase tracking-[0.25em] text-[#52525b]"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
        >
          ERROR · Atlas · Singapore
        </p>
        <h1
          className="mb-6 text-5xl font-light tracking-tight text-[#fafafa]"
          style={{ fontFamily: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif" }}
        >
          Something broke
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-[#71717a]">
          An unexpected error occurred. Try again, or head back home.
        </p>
        {error.digest && (
          <p
            className="mb-6 break-all text-[10px] text-[#3f3f46]"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
          >
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="border px-6 py-3 text-xs uppercase tracking-[0.15em] transition-colors hover:text-[#fafafa]"
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
              borderColor: "#5e7cff66",
              color: "#5e7cff",
            }}
          >
            try again
          </button>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.15em] text-[#71717a] transition-colors hover:text-[#fafafa]"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
          >
            back to Atlas →
          </Link>
        </div>
      </div>
    </main>
  );
}
