"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          Something went wrong
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">
          An unexpected error occurred
        </h1>
        <p className="text-neutral-600 mb-8 text-sm leading-relaxed">
          We apologise for the inconvenience. Please try again, or contact us if the problem persists.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-primary">Try Again</button>
          <Link href="/" className="btn-secondary">Return Home</Link>
        </div>
      </div>
    </div>
  );
}
