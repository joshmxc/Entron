"use client";
import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Plus, Upload, Search, QrCode, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const TYPE_COLORS: Record<string, string> = {
  SINGLE: "badge-blue",
  DOUBLE: "badge-green",
  FAMILY: "badge-purple",
  VIP: "badge-yellow",
};

const TYPE_LABELS: Record<string, string> = {
  SINGLE: "Mmoja", DOUBLE: "Wawili", FAMILY: "Familia", VIP: "VIP",
};

export default function GuestsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");

  const query = new URLSearchParams({ pageSize: "100" });
  if (search) query.set("search", search);
  if (filter === "in") query.set("checkedIn", "true");
  if (filter === "out") query.set("checkedIn", "false");

  const { data, isLoading } = useSWR(`/events/${eventId}/guests?${query}`, fetcher, { refreshInterval: 10000 });
  const guests = data?.data ?? [];
  const total = data?.total ?? 0;
  const isAdmin = user?.role === "ADMIN";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/events/${eventId}`} className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title flex-1">Wageni ({total})</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href={`/events/${eventId}/guests/import`} className="btn-secondary">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Ingiza</span>
            </Link>
          )}
          <Link href={`/events/${eventId}/guests/new`} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ongeza</span>
          </Link>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tafuta wageni..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 bg-entron-dark-card border border-entron-dark-border rounded-lg p-1">
          {(["all", "in", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-all",
                filter === f ? "bg-entron-blue text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {f === "all" ? "Wote" : f === "in" ? "Walioingia" : "Hawajaingia"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-center text-slate-400 py-8">Inapakia...</div>}

      {/* Desktop table */}
      <div className="table-container hidden md:block">
        <table className="entron-table">
          <thead>
            <tr>
              <th>Mgeni</th>
              <th>Simu</th>
              <th>Meza</th>
              <th>Tiketi</th>
              <th>Hali</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g: Record<string, unknown>) => (
              <tr key={String(g.id)}>
                <td>
                  <p className="font-medium text-slate-200">{g.firstName as string} {g.lastName as string}</p>
                  {g.email ? <p className="text-xs text-slate-500">{String(g.email)}</p> : null}
                </td>
                <td className="text-slate-400">{(g.phone as string) ?? "—"}</td>
                <td className="text-slate-400">{(g.tableNumber as string) ?? "—"}</td>
                <td>
                  <span className={`badge ${TYPE_COLORS[g.guestType as string] ?? "badge-blue"}`}>
                    {TYPE_LABELS[g.guestType as string] ?? g.guestType as string}
                  </span>
                </td>
                <td>
                  {g.isCheckedIn ? (
                    <span className="flex items-center gap-1 text-blue-400 text-sm">
                      <CheckCircle className="w-3.5 h-3.5" /> Ameingia
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500 text-sm">
                      <Clock className="w-3.5 h-3.5" /> Anasubiri
                    </span>
                  )}
                </td>
                <td>
                  <Link href={`/events/${eventId}/guests/${g.id}`} className="text-entron-blue text-sm hover:underline">
                    Angalia
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {guests.map((g: Record<string, unknown>) => (
          <Link
            key={String(g.id)}
            href={`/events/${eventId}/guests/${g.id}`}
            className="card flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              g.isCheckedIn ? "bg-green-900/50" : "bg-slate-700"
            }`}>
              {g.isCheckedIn
                ? <CheckCircle className="w-5 h-5 text-blue-400" />
                : <Clock className="w-5 h-5 text-slate-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200">{g.firstName as string} {g.lastName as string}</p>
              <p className="text-xs text-slate-400">{(g.phone as string) ?? ""} {g.tableNumber ? `· Meza ${g.tableNumber as string}` : ""}</p>
            </div>
            <span className={`badge ${TYPE_COLORS[g.guestType as string] ?? "badge-blue"}`}>
              {TYPE_LABELS[g.guestType as string]}
            </span>
          </Link>
        ))}
      </div>

      {!isLoading && guests.length === 0 && (
        <div className="card text-center py-12">
          <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Hakuna wageni</p>
        </div>
      )}
    </div>
  );
}
