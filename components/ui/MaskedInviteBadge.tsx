"use client";

import { useState } from "react";

export default function MaskedInviteBadge({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-white/90 px-2.5 py-1 text-xs shadow-2xs backdrop-blur-xs">
      <div className="flex items-center gap-1.5 text-stone-500">
        <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Code:</span>
        <code className="font-mono font-extrabold tracking-wider text-stone-800">
          {revealed ? code : "••••••••"}
        </code>
      </div>

      <div className="h-3.5 w-px bg-stone-200 ml-1" />

      {/* Reveal Toggle */}
      <button
        type="button"
        onClick={() => setRevealed(!revealed)}
        className="rounded-md p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        title={revealed ? "Hide invite code" : "Reveal invite code"}
      >
        {revealed ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>

      {/* Copy Code */}
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md p-1 text-stone-400 hover:text-[#1a7949] hover:bg-emerald-50 transition-colors"
        title="Copy invite code"
      >
        {copied ? (
          <span className="text-[10px] font-black text-[#1a7949] px-0.5">✓ Copied</span>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
