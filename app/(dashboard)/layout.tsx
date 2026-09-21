import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import Logo from "@/components/ui/Logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-sari-grid relative flex flex-col selection:bg-[#b7dec2] selection:text-[#0f472b] overflow-x-hidden">
      {/* Ambient background light spots */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#1a7949]/5 blur-[120px] -z-10" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[400px] w-[400px] rounded-full bg-[#b7dec2]/15 blur-[100px] -z-10" />

      {/* Top Emerald Hairline */}
      <div className="h-1 bg-gradient-to-r from-[#145a37] via-[#1a7949] to-[#2ecc71] w-full" />

      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/95 backdrop-blur-xl transition-all shadow-[0_4px_20px_-4px_rgba(22,29,38,0.03)]">
        <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between px-6 sm:px-10 lg:px-14 py-3.5">
          <Link href="/" className="group flex items-center transition-transform duration-200 active:scale-98">
            <Logo size="md" variant="full" />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-semibold">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-stone-700 transition-all hover:bg-emerald-50 hover:text-[#1a7949]"
            >
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Inventories</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-stone-700 transition-all hover:bg-emerald-50 hover:text-[#1a7949]"
            >
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </Link>

            <div className="h-4 w-px bg-stone-200 hidden sm:block" />

            {/* User Pill & Signout */}
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 py-1.5 pl-2 pr-3.5 text-xs text-stone-800 shadow-xs hover:border-emerald-400 hover:bg-emerald-100/70 transition-all"
                title="View Profile & Settings"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a7949] font-black text-white text-[10px]">
                  {userInitial}
                </div>
                <span className="max-w-[140px] truncate font-bold">{user.email}</span>
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-500 transition-all hover:bg-red-50 hover:text-[#782d2d] flex items-center gap-1 cursor-pointer"
                  title="Sign out of account"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </form>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Viewport (Full Screen Width) */}
      <main className="w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-14 py-8 flex-1 relative z-10">
        {children}
      </main>

      {/* Modern Footer (Full Screen Width) */}
      <footer className="border-t border-emerald-900/10 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-stone-500">
        <div className="w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">SariSmart OS &bull; Retail Intelligence &amp; Margin Telemetry for Sari-Sari Stores</p>
          <p className="text-[11px] text-stone-400 font-mono">100% Encrypted &bull; Multi-Branch</p>
        </div>
      </footer>
    </div>
  );
}
