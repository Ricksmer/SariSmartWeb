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
    <div className="min-h-screen bg-[#f8faf8] flex flex-col selection:bg-[#b7dec2] selection:text-[#0f472b]">
      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-xl transition-all shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center transition-transform duration-200 active:scale-98">
            <Logo size="md" variant="full" />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-semibold">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-stone-600 transition-all hover:bg-stone-100/80 hover:text-stone-900"
            >
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Inventories</span>
            </Link>

            <div className="h-4 w-px bg-stone-200 hidden sm:block" />

            {/* User Pill & Signout */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/80 py-1 pl-1.5 pr-3 text-xs text-stone-700">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a7949] font-bold text-white text-[10px]">
                  {userInitial}
                </div>
                <span className="max-w-[130px] truncate font-medium">{user.email}</span>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-all hover:bg-red-50 hover:text-[#782d2d] flex items-center gap-1"
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

      {/* Main Content Viewport */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 flex-1">
        {children}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-stone-200/60 bg-white/50 py-6 text-center text-xs text-stone-400">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>SariSmart &bull; Designed for Philippine Retail Store Operations</p>
          <p className="text-[11px] text-stone-400">Fast &bull; Multi-User &bull; Secure</p>
        </div>
      </footer>
    </div>
  );
}
