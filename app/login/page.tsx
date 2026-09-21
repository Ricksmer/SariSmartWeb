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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

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

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (mode === "register") {
      setLoading(false);
      setError(null);
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      alert("Account created successfully! Check your email to confirm, then log in.");
      return;
    }

    // Login succeeded: keep button disabled and show Confirmed state during redirect
    setIsConfirmed(true);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden">
      {/* ── LEFT HALF: 50% FULL SCREEN DEEP EMERALD HERO ── */}
      <div className="w-full lg:w-1/2 min-h-screen bg-gradient-to-br from-[#062414] via-[#0e4829] to-[#1a7949] p-8 sm:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden text-white shadow-2xl">
        {/* Ambient glow and subtle geometric pinstripe textures */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(183,222,194,0.18)_1.5px,transparent_1.5px)] bg-[size:24px_24px] opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-stripes-emerald-dark opacity-60" />
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#b7dec2]/20 blur-3xl" />

        {/* Top Header & Brand Pill */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="icon" />
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
              SariSmart<span className="text-emerald-300">.</span>
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-emerald-200 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span>Philippine Retail &amp; Wholesale OS</span>
          </div>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-auto py-10 space-y-7">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.12] font-heading">
              Next-Gen Inventory Intelligence for{" "}
              <span className="text-emerald-300 underline decoration-emerald-400/50 decoration-wavy decoration-2">
                Sari-Sari Stores
              </span>
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed max-w-xl">
              Replace messy manual paper notebooks. Track wholesale buy costs, live ₱ profit margins, auto-extract product sizes, print categorized price sheets, and collaborate across branches with your staff.
            </p>
          </div>

          {/* 4 Feature Cards (Translucent Emerald Glass, Zero Developer Jargon) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:border-emerald-300/60 hover:scale-[1.02]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/25 text-emerald-200 font-bold">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm font-heading">Margin Telemetry</h3>
                  <p className="text-xs text-emerald-100/80 font-medium mt-0.5">Live gross margins &amp; capital tracking.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:border-emerald-300/60 hover:scale-[1.02]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/25 text-emerald-200 font-bold">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm font-heading">PDF Price List Printing</h3>
                  <p className="text-xs text-emerald-100/80 font-medium mt-0.5">Native ₱ currency, clean layout, category sheets.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:border-emerald-300/60 hover:scale-[1.02]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/25 text-emerald-200 font-bold">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm font-heading">Multi-Store &amp; Staff Sync</h3>
                  <p className="text-xs text-emerald-100/80 font-medium mt-0.5">Separate owned stores &amp; masked codes.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:border-emerald-300/60 hover:scale-[1.02]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/25 text-emerald-200 font-bold">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm font-heading">AI Store Assistant</h3>
                  <p className="text-xs text-emerald-100/80 font-medium mt-0.5">Ask stock levels, update prices &amp; manage items.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Health Strip */}
        <div className="relative z-10 rounded-2xl bg-black/25 border border-white/15 p-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/30 text-emerald-300 font-black text-sm">
              ₱
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Retail Intelligence</p>
              <p className="text-sm font-extrabold text-white">Live Cloud Inventory Telemetry</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Real-Time Sync</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT HALF: 50% FULL SCREEN CLEAN WHITE AUTH ── */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-center items-center p-6 sm:p-12 xl:p-16 relative">
        {/* Subtle background ambient corner accent */}
        <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-100/30 blur-3xl -z-0" />

        <div className="w-full max-w-md relative z-10 space-y-6 animate-fade-in">
          {/* Card Frame */}
          <div className="card relative overflow-hidden p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(26,121,73,0.12)] border-emerald-200/80 bg-white">
            {/* Top Emerald Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71]" />

            {/* Header / Mode Indicator */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-heading">
                {mode === "login" ? "Welcome Back" : "Create Store Account"}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
                {mode === "login"
                  ? "Sign in to access your retail catalogs & telemetry."
                  : "Launch your store catalog in less than 30 seconds."}
              </p>
            </div>

            {/* Animated Sliding Segmented Switcher */}
            <div className="relative mb-6 flex rounded-xl bg-stone-100 p-1.5 text-sm font-bold border border-stone-200/60 select-none">
              {/* Sliding Indicator Pill */}
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-lg bg-white shadow-md transition-all duration-300 ease-out border border-stone-200/80 ${
                  mode === "login" ? "left-1.5" : "left-[calc(50%+3px)]"
                }`}
              />

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setConfirmPassword("");
                  setError(null);
                }}
                className={`relative z-10 flex-1 py-2 text-center text-xs font-bold transition-colors cursor-pointer ${
                  mode === "login" ? "text-[#1a7949]" : "text-stone-500 hover:text-stone-800"
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
                className={`relative z-10 flex-1 py-2 text-center text-xs font-bold transition-colors cursor-pointer ${
                  mode === "register" ? "text-[#1a7949]" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-[#fdf2f2] p-3 text-xs text-[#782d2d] animate-fade-in flex items-start gap-2 shadow-xs">
                  <svg className="w-4 h-4 shrink-0 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <span className="text-sm font-bold">@</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="storeowner@gmail.com"
                    required
                    className="input input-has-icon-left"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input input-has-icon-left input-has-icon-right font-mono"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="input input-has-icon-left font-mono"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isConfirmed}
                className="btn btn-primary btn-shimmer w-full py-3 text-sm font-black shadow-lg mt-2 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed transition-all"
              >
                {isConfirmed ? (
                  <span className="flex items-center justify-center gap-2 text-white">
                    <svg className="h-4 w-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirmed &bull; Redirecting...</span>
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{mode === "login" ? "Logging in..." : "Creating account..."}</span>
                  </span>
                ) : mode === "login" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>Log in</span>
                    <span>→</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Create Account</span>
                    <span>→</span>
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
              <span>Encrypted Supabase Auth</span>
              <span>256-Bit SSL Secured</span>
            </div>
          </div>

          <p className="text-center text-xs text-stone-500 font-medium">
            SariSmart OS &copy; 2026 &bull; All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
