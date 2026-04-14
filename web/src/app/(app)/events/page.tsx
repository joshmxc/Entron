"use client";
import Link from "next/link";
import useSWR from "swr";
import { Plus, Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useEventStore } from "@/store/eventStore";
import { formatDate } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function EventsPage() {
  const { user } = useAuthStore();
  const { setActiveEvent } = useEventStore();
  const { data, isLoading } = useSWR("/events", fetcher);
  const isAdmin = user?.role === "ADMIN";

  const events = data?.data ?? [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Matukio</h1>
        {isAdmin && (
          <Link href="/events/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Tukio Jipya
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="text-slate-400 text-center py-12">Inapakia...</div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Hakuna matukio bado</p>
          {isAdmin && (
            <Link href="/events/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Unda Tukio la Kwanza
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {events.map((event: Record<string, unknown>) => (
          <Link
            key={String(event.id)}
            href={`/events/${event.id}`}
            onClick={() => setActiveEvent({
              id: event.id as string,
              name: event.name as string,
              venue: event.venue as string,
              startDate: event.startDate as string,
            })}
            className="card hover:border-entron-blue/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-100 truncate">{event.name as string}</h3>
                  <span className={`badge ${event.isActive ? "badge-green" : "badge-red"}`}>
                    {event.isActive ? "Inafanya Kazi" : "Imefungwa"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-400 mb-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{event.venue as string}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(event.startDate as string, "dd MMM yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {(event._count as Record<string, number>)?.guests ?? 0} wageni
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-entron-blue transition-colors flex-shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
