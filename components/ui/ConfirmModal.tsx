"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open && !loading) {
        onCancel();
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!mounted || !open || typeof document === "undefined") {
    return null;
  }

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Top Accent Line */}
        <div
          className={`h-1.5 ${
            isDanger
              ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-400"
              : isWarning
              ? "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300"
              : "bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71]"
          }`}
        />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Status Icon */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                isDanger
                  ? "bg-red-100 text-red-600 border border-red-200/80"
                  : isWarning
                  ? "bg-amber-100 text-amber-700 border border-amber-200/80"
                  : "bg-emerald-100 text-[#1a7949] border border-emerald-200/80"
              }`}
            >
              {isDanger ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              ) : isWarning ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-base font-black text-stone-900 font-heading leading-snug"
              >
                {title}
              </h3>
              {description && (
                <div className="text-xs sm:text-sm text-stone-500 font-medium mt-1.5 leading-relaxed">
                  {description}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={async () => {
                await onConfirm();
              }}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                  : isWarning
                  ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                  : "bg-[#1a7949] hover:bg-[#145a37] active:bg-[#0f4429]"
              }`}
            >
              {loading && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
