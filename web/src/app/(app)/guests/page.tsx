"use client";
import { useState } from "react";
import useSWR from "swr";
import { Search, Users } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function GlobalGuestsPage() {
  const [search, setSearch] = useState("");

  // For global search we'd need a dedicated endpoint; here we show a placeholder
  return (
    <div>
      <h1 className="page-title mb-6">Tafuta Wageni</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tafuta kwa jina au simu..."
          className="pl-10"
        />
      </div>

      {!search && (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Andika jina au nambari ya simu kutafuta mgeni</p>
          <p className="text-slate-500 text-sm mt-1">Au nenda kwenye tukio husika kuona wageni wake</p>
          <Link href="/events" className="btn-primary mt-4 inline-flex">
            Angalia Matukio
          </Link>
        </div>
      )}
    </div>
  );
}
