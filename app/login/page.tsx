"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (mode === "register") {
      setError(null);
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      alert("Account registered successfully! Check your email to confirm, then log in.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f8faf8] bg-mesh-pattern px-4 py-12">
      {/* Decorative ambient background blur orbs */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#1a7949]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 h-80 w-80 rounded-full bg-[#b7dec2]/30 blur-3xl" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" variant="full" className="mb-3 group cursor-pointer" />
          <p className="text-sm font-medium text-stone-500">
            Intelligent Inventory &amp; Point-of-Sale for Sari-Sari Stores
          </p>
        </div>

        <div className="card relative overflow-hidden p-7 shadow-xl border-stone-200/90 backdrop-blur-xl bg-white/95">
          {/* Subtle top brand accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1a7949] via-[#22995d] to-[#b7dec2]" />

          {/* Mode Switcher */}
          <div className="mb-6 flex rounded-xl bg-stone-100/90 p-1.5 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setConfirmPassword("");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 transition-all duration-200 ${
                mode === "login"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 transition-all duration-200 ${
                mode === "register"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="storeowner@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {mode === "register" && (
              <div className="animate-fade-in">
                <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-[#782d2d] flex items-center gap-2 animate-fade-in">
                <svg className="w-4 h-4 shrink-0 text-[#782d2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-2 py-3 text-base shadow-md font-bold tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : mode === "login" ? (
                "Log In to Dashboard →"
              ) : (
                "Create Store Account →"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-stone-400">
          SariSmart &copy; 2026 &bull; Secure Multi-Store Cloud Management
        </p>
      </div>
    </div>
  );
}
