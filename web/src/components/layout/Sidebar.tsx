"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users,
  Mail, UserCog, Settings, LogOut,
  MessageSquare, Sun, Moon, ScanLine,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";

const navItems = [
  { href: "/dashboard",   label: { sw: "Dashibodi",   en: "Dashboard" },   icon: LayoutDashboard },
  { href: "/events",      label: { sw: "Matukio",     en: "Events" },      icon: Calendar },
  { href: "/guests",      label: { sw: "Wageni",      en: "Guests" },      icon: Users },
  { href: "/invitations", label: { sw: "Mialiko",     en: "Invitations" }, icon: Mail },
  { href: "/messages",    label: { sw: "Ujumbe/SMS",  en: "Messages/SMS" },icon: MessageSquare },
  { href: "/staff",       label: { sw: "Wafanyakazi", en: "Staff" },       icon: UserCog, adminOnly: true },
  { href: "/settings",    label: { sw: "Mipangilio",  en: "Settings" },    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const { lang, toggle: toggleLang } = useLang();
  const { isDark, toggle: toggleTheme } = useTheme();

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    clear();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--surface)", borderRight: "1px solid var(--border)" }}>
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-entron-blue rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg leading-none">E</span>
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "var(--text)" }}>Entron</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {user?.role === "ADMIN" ? "Admin Panel" : "Staff Panel"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "ADMIN")
          .map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={cn("nav-item", active && "active")}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label[lang]}
              </Link>
            );
          })}
      </nav>

      {/* Start Scanning CTA */}
      <div className="px-3 pb-3">
        <Link href="/scanner"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#1e3a8a,#1e3a8a)", boxShadow: "0 2px 8px rgba(30,58,138,0.35)" }}>
          <ScanLine className="w-4 h-4" />
          {lang === "sw" ? "Anza Kuscan" : "Start Scanning"}
        </Link>
      </div>

      {/* Bottom controls */}
      <div className="p-3 space-y-1.5" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-1 transition-all"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {isDark ? <><Sun className="w-3.5 h-3.5 text-amber-400" /> Light</> : <><Moon className="w-3.5 h-3.5" /> Dark</>}
          </button>
          {/* Lang toggle */}
          <button onClick={toggleLang}
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)" }}>
            <span className={cn("text-xs px-2.5 py-1.5 font-semibold transition-all", lang === "sw" ? "bg-entron-blue text-white" : "text-[var(--text-muted)]")} style={lang !== "sw" ? { backgroundColor: "var(--surface-2)" } : {}}>SW</span>
            <span className={cn("text-xs px-2.5 py-1.5 font-semibold transition-all", lang === "en" ? "bg-entron-blue text-white" : "text-[var(--text-muted)]")} style={lang !== "en" ? { backgroundColor: "var(--surface-2)" } : {}}>EN</span>
          </button>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ backgroundColor: "var(--surface-2)" }}>
          <div className="w-8 h-8 bg-entron-blue/15 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-entron-blue/20">
            <span className="text-entron-blue font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{user?.name}</p>
            <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{(user?.role ?? "").toLowerCase()}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:text-red-500 transition-colors" style={{ color: "var(--text-faint)" }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
