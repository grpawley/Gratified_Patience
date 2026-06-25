"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Clock, Settings, LogOut, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-56 min-h-screen bg-[#FAF7F2] border-r border-[#B8C4B8]/30 p-4 gap-1">
        <div className="px-3 py-4 mb-4">
          <h1 className="text-xl font-light text-[#3D3D3D]">Stoa</h1>
        </div>

        <Link
          href="/wants/new"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#7C9A82] text-white hover:bg-[#6b8870] transition-colors mb-4"
        >
          <PlusCircle size={18} />
          <span className="text-sm font-medium">Log a want</span>
        </Link>

        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-[#7C9A82]/15 text-[#7C9A82] font-medium"
                : "text-[#3D3D3D] hover:bg-[#3D3D3D]/5"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}

        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#3D3D3D] hover:bg-[#3D3D3D]/5 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF7F2] border-t border-[#B8C4B8]/30 flex z-50">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
              pathname.startsWith(href)
                ? "text-[#7C9A82]"
                : "text-[#B8C4B8]"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <Link
          href="/wants/new"
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-[#7C9A82]"
        >
          <PlusCircle size={20} />
          Log
        </Link>
      </nav>
    </>
  );
}
