"use client";
import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Users, QrCode, TrendingUp, CheckCircle, Scan, Mail, ArrowLeft, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useEventStore } from "@/store/eventStore";
import { useEffect } from "react";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { setActiveEvent } = useEventStore();

  const { data: eventData } = useSWR(`/events/${eventId}`, fetcher);
  const { data: statsData } = useSWR(`/events/${eventId}/stats`, fetcher, { refreshInterval: 15000 });

  const event = eventData?.data;
  const stats = statsData?.data;

  useEffect(() => {
    if (event) {
      setActiveEvent({ id: event.id, name: event.name, venue: event.venue, startDate: event.startDate });
    }
  }, [event]);

  if (!event) return <div className="text-slate-400 text-center py-12">Inapakia...</div>;

  const attendance = stats?.attendance ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/events" className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="page-title truncate">{event.name}</h1>
          <p className="text-sm text-slate-400">{event.venue} · {formatDate(event.startDate, "dd MMM yyyy")}</p>
        </div>
      </div>

      {/* Attendance bar */}
      {stats && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Mahudhurio</span>
            <span className="text-lg font-bold text-entron-blue">{attendance}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-entron-blue h-3 rounded-full transition-all"
              style={{ width: `${attendance}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{stats.checkedIn} walioingia</span>
            <span>{stats.totalGuests} wote</span>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Wageni Wote", value: stats?.totalGuests ?? 0, icon: Users, color: "text-blue-400" },
          { label: "Walioingia", value: stats?.checkedIn ?? 0, icon: CheckCircle, color: "text-blue-400" },
          { label: "Skani Zote", value: stats?.scans?.total ?? 0, icon: QrCode, color: "text-purple-400" },
          { label: "Halali", value: stats?.scans?.SUCCESS ?? 0, icon: TrendingUp, color: "text-entron-blue" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href={`/events/${eventId}/guests`} className="card hover:border-entron-blue/50 transition-all text-center py-6">
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="font-medium text-slate-200">Wageni</p>
        </Link>
        <Link href={`/events/${eventId}/scan`} className="card hover:border-entron-blue/50 transition-all text-center py-6 border-entron-blue/30">
          <Scan className="w-8 h-8 text-entron-blue mx-auto mb-2" />
          <p className="font-medium text-slate-200">Skana</p>
        </Link>
        <Link href={`/events/${eventId}/invitations`} className="card hover:border-entron-blue/50 transition-all text-center py-6">
          <Mail className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="font-medium text-slate-200">Mialiko</p>
        </Link>
        <Link href={`/events/${eventId}/messages`} className="card hover:border-entron-blue/50 transition-all text-center py-6">
          <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="font-medium text-slate-200">Ujumbe</p>
        </Link>
      </div>
    </div>
  );
}
