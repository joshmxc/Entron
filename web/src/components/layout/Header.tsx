"use client";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Bell, Sun, Moon, LogOut, WifiOff, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const pageTitles: Record<string, { sw: string; en: string }> = {
  "/dashboard":   { sw: "Dashibodi",   en: "Dashboard" },
  "/events":      { sw: "Matukio",     en: "Events" },
  "/guests":      { sw: "Wageni",      en: "Guests" },
  "/invitations": { sw: "Mialiko",     en: "Invitations" },
  "/messages":    { sw: "Ujumbe/SMS",  en: "Messages/SMS" },
  "/staff":       { sw: "Wafanyakazi", en: "Staff" },
  "/settings":    { sw: "Mipangilio",  en: "Settings" },
  "/scanner":     { sw: "Skana",       en: "Scanner" },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const { lang, toggle: toggleLang } = useLang();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [online, setOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const titleObj = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1];
  const title = titleObj ? titleObj[lang] : "Entron";

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    clear();
    router.push("/login");
  };

  return (
    <header className="h-14 flex items-center px-4 md:px-6 justify-between sticky top-0 z-10"
      style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>

      <h1 className="font-semibold text-base" style={{ color: "var(--text)" }}>{title}</h1>

      <div className="flex items-center gap-2">
        {/* Online badge */}
        {!online && (
          <div className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <WifiOff className="w-3 h-3" />
            {lang === "sw" ? "Nje ya Mtandao" : "Offline"}
          </div>
        )}

        {/* Theme toggle — mobile */}
        <button onClick={toggleTheme}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
        </button>

        {/* Lang toggle — mobile */}
        <button onClick={toggleLang}
          className="md:hidden flex items-center rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)" }}>
          <span className={cn("text-xs px-2 py-1 font-semibold", lang === "sw" ? "bg-entron-blue text-white" : "text-[var(--text-muted)]")} style={lang !== "sw" ? { backgroundColor: "var(--surface-2)" } : {}}>SW</span>
          <span className={cn("text-xs px-2 py-1 font-semibold", lang === "en" ? "bg-entron-blue text-white" : "text-[var(--text-muted)]")} style={lang !== "en" ? { backgroundColor: "var(--surface-2)" } : {}}>EN</span>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <Bell className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2" style={{ borderColor: "var(--surface)" }} />
        </button>

        {/* Avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-xl transition-colors"
            style={{ backgroundColor: menuOpen ? "var(--surface-2)" : "transparent" }}>
            <div className="w-7 h-7 bg-entron-blue/15 rounded-full flex items-center justify-center ring-2 ring-entron-blue/25">
              <span className="text-entron-blue font-bold text-xs">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="hidden sm:block text-sm font-medium" style={{ color: "var(--text)" }}>{user?.name}</span>
            <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: "var(--text-muted)" }} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl py-1 z-50"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
              <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{user?.name}</p>
                <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{(user?.role ?? "").toLowerCase()}</p>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut className="w-4 h-4" />
                {lang === "sw" ? "Toka" : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
