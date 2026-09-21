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
      alert("Account created successfully! Check your email to confirm, then log in.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-sari-grid flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#1a7949]/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#b7dec2]/20 blur-[140px]" />

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-stretch z-10 py-4">
        {/* LEFT COLUMN: HIGH-CONTRAST EMERALD HERO SHOWCASE */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#092d19] via-[#124f30] to-[#1a7949] p-7 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-emerald-600/30 animate-fade-in">
          {/* Subtle geometric pattern overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(183,222,194,0.15)_1px,transparent_1px)] bg-[size:20px_20px] opacity-75" />
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#b7dec2]/15 blur-3xl" />

          <div className="relative z-10 space-y-6">
            {/* Brand Lockup with White Text */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo size="md" variant="icon" />
                <span className="text-2xl font-black tracking-tight text-white font-heading">
                  SariSmart<span className="text-emerald-300">.</span>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-bold text-emerald-200 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                <span>Philippine Retail &amp; Wholesale OS</span>
              </div>
            </div>

            {/* Hero Headline with High Contrast */}
            <div className="space-y-3 pt-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12] font-heading">
                Next-Gen Inventory Intelligence for{" "}
                <span className="text-emerald-300 underline decoration-emerald-400/50 decoration-wavy decoration-2">
                  Sari-Sari Stores
                </span>
              </h1>
              <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed max-w-xl">
                Ditch the messy manual notebooks. Track wholesale buy costs, live ₱ profit margins, auto-extract product sizes, print 5-page categorized price sheets, and collaborate across branches with your staff.
              </p>
            </div>

            {/* 4 Feature Cards with Translucent Emerald Glass Styling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                    <h3 className="font-extrabold text-white text-sm font-heading">5-Page PDF Printing</h3>
                    <p className="text-xs text-emerald-100/80 font-medium mt-0.5">Zero overlap, native ₱, category sheets.</p>
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
                    <h3 className="font-extrabold text-white text-sm font-heading">AI Store Copilot</h3>
                    <p className="text-xs text-emerald-100/80 font-medium mt-0.5">Natural language CRUD &amp; stock inquiry.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live Metric Badge */}
          <div className="relative z-10 mt-6 rounded-2xl bg-black/25 border border-white/15 p-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/30 text-emerald-300 font-black text-sm">
                ₱
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Live Catalog Health</p>
                <p className="text-sm font-extrabold text-white">159 Products Auto-Formatted</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Zero Leakage</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CLEAN LIGHT AUTH CARD */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto flex flex-col justify-center animate-fade-in">
          <div className="card relative overflow-hidden p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(26,121,73,0.18)] border-emerald-200/80 backdrop-blur-xl bg-white/98">
            {/* Top Emerald Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71]" />

            {/* Header / Mode Indicator */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-stone-900 tracking-tight font-heading">
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
                className={`relative z-10 flex-1 py-2 text-center text-xs sm:text-sm transition-colors duration-200 cursor-pointer ${
                  mode === "login" ? "text-stone-900 font-extrabold" : "text-stone-500 hover:text-stone-800"
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
                className={`relative z-10 flex-1 py-2 text-center text-xs sm:text-sm transition-colors duration-200 cursor-pointer ${
                  mode === "register" ? "text-stone-900 font-extrabold" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Animated Form Container */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={mode === "login" ? "animate-tab-left" : "animate-tab-right"}>
                <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="storeowner@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-has-icon-left font-medium"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={mode === "login" ? "animate-tab-left" : "animate-tab-right"}>
                <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-has-icon-left input-has-icon-right font-medium"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
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
                <div className="animate-tab-right">
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input input-has-icon-left input-has-icon-right font-medium"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs sm:text-sm text-[#782d2d] flex items-center gap-2.5 animate-scale-up font-semibold">
                  <svg className="w-4 h-4 shrink-0 text-[#782d2d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-shimmer w-full mt-2 py-3.5 text-sm sm:text-base font-extrabold tracking-wide shadow-lg cursor-pointer transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : mode === "login" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>Sign In to Dashboard</span>
                    <span>→</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Create Store Account</span>
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

          <p className="mt-6 text-center text-xs text-stone-500 font-medium">
            SariSmart OS &copy; 2026 &bull; Designed for Philippine MSME Grocers
          </p>
        </div>
      </div>
    </div>
  );
}
