"use client";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Sun, Moon, LogOut, WifiOff, ChevronDown, CheckCircle, XCircle, ScanLine } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { useScanStore } from "@/store/scanStore";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard":   "Dashboard",
  "/events":      "Events",
  "/guests":      "Guests",
  "/invitations": "Invitations",
  "/messages":    "Messages/SMS",
  "/staff":       "Staff",
  "/settings":    "Settings",
  "/scanner":     "Scanner",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { recentScans } = useScanStore();
  const [online, setOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const title = Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] ?? "Entron";
  const unreadCount = recentScans.length - lastSeenCount;

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    clear();
    router.push("/login");
  };

  const openNotifications = () => {
    setNotifOpen(!notifOpen);
    setLastSeenCount(recentScans.length);
  };

  return (
    <header className="h-14 flex items-center px-4 md:px-6 justify-between sticky top-0 z-10"
      style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>

      <h1 className="font-semibold text-base" style={{ color: "var(--text)" }}>{title}</h1>

      <div className="flex items-center gap-2">
        {/* Offline badge */}
        {!online && (
          <div className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <WifiOff className="w-3 h-3" /> Offline
          </div>
        )}

        {/* Theme toggle — mobile */}
        <button onClick={toggleTheme}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={openNotifications}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Bell className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl z-50 overflow-hidden"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Recent Scans</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-entron-blue/10 text-entron-blue font-medium">
                  {recentScans.length} total
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {recentScans.length === 0 ? (
                  <div className="py-8 text-center">
                    <ScanLine className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-faint)" }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No scans yet</p>
                  </div>
                ) : (
                  recentScans.slice(0, 10).map((scan, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        scan.status === "SUCCESS" ? "bg-green-500/15" : "bg-red-500/15"
                      }`}>
                        {scan.status === "SUCCESS"
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                          {scan.guest ? `${scan.guest.firstName} ${scan.guest.lastName}` : "Unknown Guest"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {scan.status === "SUCCESS" ? "Checked in" :
                           scan.status === "ALREADY_SCANNED" ? "Already scanned" :
                           scan.status === "LIMIT_REACHED" ? "Limit reached" :
                           scan.status === "WRONG_EVENT" ? "Wrong event" : "Invalid QR"}
                          {scan.staffName ? ` · ${scan.staffName}` : ""}
                        </p>
                      </div>
                      <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--text-faint)" }}>
                        {scan.timestamp ? formatDate(scan.timestamp, "HH:mm") : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {recentScans.length > 0 && (
                <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Showing last {Math.min(recentScans.length, 10)} scans this session
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

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
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
