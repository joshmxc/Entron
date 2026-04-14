"use client";
import { useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Users, CheckCircle, QrCode, TrendingUp, AlertCircle, ScanLine, ArrowUpRight, Clock } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useScanStore } from "@/store/scanStore";
import { useEventStore } from "@/store/eventStore";
import { useSocket, joinDashboard, joinStaffRoom } from "@/hooks/useSocket";
import { useLang } from "@/hooks/useLang";
import { formatDate } from "@/lib/utils";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const fetcher = (url: string) => api.get(url).then((r) => r.data);

function SparkLine({ data }: { data: number[] }) {
  return (
    <Line
      data={{ labels: data.map((_, i) => String(i)), datasets: [{ data, borderColor: "#1e3a8a", backgroundColor: "rgba(30,58,138,0.08)", borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0 }] }}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, animation: false }}
    />
  );
}

function StatCard({ label, value, sub, icon: Icon, iconBg, trend }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; iconBg: string; trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + iconBg}><Icon className="w-5 h-5" /></div>
        {trend && <span className="text-xs font-semibold text-entron-blue flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{trend}</span>}
      </div>
      <p className="text-2xl font-bold mt-3" style={{ color: "var(--text)" }}>{value}</p>
      {sub && <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeEvent } = useEventStore();
  const { recentScans, totalToday, validToday, invalidToday, addLiveScan } = useScanStore();
  const { lang } = useLang();
  const socket = useSocket();
  const isAdmin = user?.role === "ADMIN";

  const { data: stats } = useSWR(
    activeEvent ? `/dashboard/${isAdmin ? "admin" : "staff"}?eventId=${activeEvent.id}` : null,
    fetcher, { refreshInterval: 30000 }
  );

  useEffect(() => {
    if (!socket) return;
    if (isAdmin) joinDashboard(); else joinStaffRoom();
    socket.on("scan:new", (data) => { addLiveScan({ status: data.status, message: data.message ?? "", guest: data.guest, timestamp: data.timestamp, staffName: data.staffName }); });
    return () => { socket.off("scan:new"); };
  }, [socket, isAdmin]);

  const eventData = stats?.data?.event ?? stats?.data;
  const total = eventData?.totalGuests ?? 0;
  const checkedIn = eventData?.checkedIn ?? 0;
  const attendance = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const sparkData = [12, 28, 18, 45, 32, 55, 41, checkedIn > 0 ? Math.min(checkedIn, 80) : 20];

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Welcome bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {lang === "sw" ? "Karibu, " : "Welcome back, "}{user?.name}
            {activeEvent && <span className="font-normal text-sm ml-2" style={{ color: "var(--text-muted)" }}>| {activeEvent.name}</span>}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {lang === "sw" ? "Tazama takwimu za tukio lako" : "Here is an overview of your event"}
          </p>
        </div>
        <Link href="/scanner" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#1e3a8a,#1e3a8a)", boxShadow: "0 2px 8px rgba(30,58,138,0.3)" }}>
          <ScanLine className="w-4 h-4" />{lang === "sw" ? "Anza Kuscan" : "Start Scanning"}
        </Link>
      </div>

      {/* No event warning */}
      {!activeEvent && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ backgroundColor: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.3)", color: "#92400e" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{lang === "sw" ? "Chagua tukio kwenye Matukio ili kuona takwimu." : "Select an event from Events to see stats."}</p>
          <Link href="/events" className="ml-auto text-xs font-semibold underline underline-offset-2">{lang === "sw" ? "Nenda" : "Go"}</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={lang === "sw" ? "Wageni Wote" : "Total Guests"} value={total.toLocaleString()} icon={Users} iconBg="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard label={lang === "sw" ? "Walioingia Leo" : "Check-ins Today"} value={checkedIn.toLocaleString()}
          sub={`${attendance}% ${lang === "sw" ? "ya wageni" : "of guests"}`}
          icon={CheckCircle} iconBg="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-blue-400" trend={attendance > 0 ? `${attendance}%` : undefined} />
        <StatCard label={lang === "sw" ? "Skani Zangu Leo" : "My Scans Today"} value={totalToday}
          sub={`${validToday} ${lang === "sw" ? "halali" : "valid"} · ${invalidToday} ${lang === "sw" ? "batili" : "invalid"}`}
          icon={QrCode} iconBg="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"><TrendingUp className="w-5 h-5" /></div>
          <p className="text-2xl font-bold mt-3" style={{ color: "var(--text)" }}>{attendance}%</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{lang === "sw" ? "Mahudhurio" : "Attendance"}</p>
          <div className="h-10 mt-1"><SparkLine data={sparkData} /></div>
        </div>
      </div>

      {/* Progress bar */}
      {activeEvent && total > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{lang === "sw" ? "Maendeleo ya Mahudhurio" : "Check-in Progress"}</p>
            <span className="text-sm font-bold text-entron-blue">{checkedIn} / {total}</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="h-2.5 rounded-full bg-entron-blue transition-all duration-700" style={{ width: `${Math.min(attendance, 100)}%` }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{attendance}% {lang === "sw" ? "wamefika" : "arrived"}</p>
        </div>
      )}

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent scans */}
        <div className="lg:col-span-2 card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text)" }}>
              <span className="w-2 h-2 bg-entron-blue rounded-full animate-pulse" />
              {lang === "sw" ? "Skani za Sasa Hivi" : "Recent Check-ins"}
            </h3>
            <Link href="/guests" className="text-xs text-entron-blue font-medium hover:underline">{lang === "sw" ? "Ona Zote" : "View all"} →</Link>
          </div>
          {recentScans.length === 0 ? (
            <div className="py-10 text-center">
              <QrCode className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-faint)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{lang === "sw" ? "Hakuna skani bado" : "No scans yet"}</p>
              <Link href="/scanner" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-entron-blue hover:underline">
                <ScanLine className="w-3.5 h-3.5" />{lang === "sw" ? "Anza Kuscan" : "Start scanning"}
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "var(--surface-2)" }}>
                  <tr>
                    {[lang === "sw" ? "Wakati" : "Time", lang === "sw" ? "Jina" : "Guest Name", lang === "sw" ? "Aina" : "Type", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentScans.slice(0, 6).map((scan, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)", backgroundColor: "var(--surface)" }}>{scan.timestamp ? formatDate(scan.timestamp, "HH:mm:ss") : "—"}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text)", backgroundColor: "var(--surface)" }}>{scan.guest ? `${scan.guest.firstName} ${scan.guest.lastName}` : "—"}</td>
                      <td className="px-4 py-3" style={{ backgroundColor: "var(--surface)" }}><span className="badge badge-blue">{(scan.guest as Record<string, unknown>)?.guestType as string ?? "Guest"}</span></td>
                      <td className="px-4 py-3" style={{ backgroundColor: "var(--surface)" }}><span className={`badge ${scan.status === "SUCCESS" ? "badge-green" : "badge-red"}`}>{scan.status === "SUCCESS" ? (lang === "sw" ? "Halali" : "Valid") : (lang === "sw" ? "Batili" : "Invalid")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Scan Now */}
          <div className="card space-y-3">
            <div className="w-10 h-10 bg-entron-blue/10 rounded-xl flex items-center justify-center"><ScanLine className="w-5 h-5 text-entron-blue" /></div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>{lang === "sw" ? "Skana Sasa" : "Scan Now"}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{lang === "sw" ? "Fungua kamera yako kuscan QR code za wageni" : "Open your camera to scan guest QR codes"}</p>
            </div>
            <Link href="/scanner" className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#1e3a8a)", boxShadow: "0 2px 8px rgba(30,58,138,0.3)" }}>
              <ScanLine className="w-4 h-4" />{lang === "sw" ? "Anza Kuscan" : "Start Scanning"}
            </Link>
          </div>

          {/* Staff leaderboard or personal stats */}
          {isAdmin && stats?.data?.staff?.length > 0 ? (
            <div className="card space-y-3">
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{lang === "sw" ? "Wafanyakazi Bora" : "Top Staff"}</p>
              <div className="space-y-2">
                {[...stats.data.staff].sort((a: Record<string, number>, b: Record<string, number>) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 4).map((s: Record<string, unknown>, i: number) => (
                  <div key={String(s.id)} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--surface-2)" }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: i === 0 ? "#d97706" : "var(--text-faint)" }}>{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-entron-blue/10 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-entron-blue">{(String(s.name)[0] ?? "?").toUpperCase()}</span></div>
                    <p className="flex-1 text-sm font-medium truncate" style={{ color: "var(--text)" }}>{String(s.name)}</p>
                    <span className="text-sm font-bold text-entron-blue">{String(s.total ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : !isAdmin ? (
            <div className="card space-y-2">
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{lang === "sw" ? "Skani Zangu Leo" : "My Scans Today"}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--surface-2)" }}><p className="text-2xl font-bold text-entron-blue">{validToday}</p><p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{lang === "sw" ? "Halali" : "Valid"}</p></div>
                <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--surface-2)" }}><p className="text-2xl font-bold text-red-500">{invalidToday}</p><p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{lang === "sw" ? "Batili" : "Invalid"}</p></div>
              </div>
            </div>
          ) : null}

          {/* Quick links */}
          <div className="card space-y-1.5">
            <p className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>{lang === "sw" ? "Viungo vya Haraka" : "Quick Links"}</p>
            {[{ href: "/guests", icon: Users, label: lang === "sw" ? "Wageni" : "Guests" }, { href: "/invitations", icon: Clock, label: lang === "sw" ? "Mialiko" : "Invitations" }, { href: "/messages", icon: TrendingUp, label: lang === "sw" ? "Ujumbe" : "Messages" }].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors" style={{ backgroundColor: "var(--surface-2)" }}>
                <Icon className="w-4 h-4 text-entron-blue" />
                <span className="text-sm font-medium flex-1" style={{ color: "var(--text)" }}>{label}</span>
                <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
