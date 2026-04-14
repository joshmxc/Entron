"use client";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, RefreshCw, Phone, Mail, QrCode, CheckCircle, Clock, Printer } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then((r) => r.data);
const TYPE_LABELS: Record<string, string> = { SINGLE: "Mmoja", DOUBLE: "Wawili", FAMILY: "Familia", VIP: "VIP" };
const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Ameingia",
  ALREADY_SCANNED: "Imeskanwa",
  LIMIT_REACHED: "Kikomo",
  INVALID_QR: "Batili",
  WRONG_EVENT: "Tukio Tofauti",
};

export default function GuestDetailPage({ params }: { params: Promise<{ eventId: string; guestId: string }> }) {
  const { eventId, guestId } = use(params);
  const { data, mutate } = useSWR(`/events/${eventId}/guests/${guestId}`, fetcher);
  const guest = data?.data;

  const regenerateQR = async () => {
    await api.post(`/events/${eventId}/guests/${guestId}/regenerate-qr`);
    mutate();
  };

  if (!guest) return <div className="text-slate-400 text-center py-12">Inapakia...</div>;

  // QR images are proxied via Next.js rewrites — use relative path
  const apiBase = "";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/events/${eventId}/guests`} className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title">{guest.firstName} {guest.lastName}</h1>
      </div>

      {/* Status banner */}
      <div className={`card flex items-center gap-3 ${guest.isCheckedIn ? "border-green-700/50" : "border-slate-600/50"}`}>
        {guest.isCheckedIn
          ? <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
          : <Clock className="w-6 h-6 text-slate-400 flex-shrink-0" />
        }
        <div>
          <p className="font-semibold text-slate-100">
            {guest.isCheckedIn ? "Ameingia" : "Hajaingiza bado"}
          </p>
          {guest.checkedInAt && (
            <p className="text-sm text-slate-400">{formatDate(guest.checkedInAt)}</p>
          )}
          <p className="text-sm text-slate-400">
            Imeingia {guest.admissionsUsed}/{guest.maxAdmissions} mara
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Info */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-slate-200">Taarifa za Mgeni</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Aina ya Tiketi", value: TYPE_LABELS[guest.guestType] ?? guest.guestType },
              { label: "Meza", value: guest.tableNumber ?? "—" },
              { label: "Kiti", value: guest.seatNumber ?? "—" },
              { label: "Maelezo", value: guest.notes ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200">{value}</span>
              </div>
            ))}
            {guest.phone && (
              <div className="flex items-center gap-2 pt-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-200">{guest.phone}</span>
              </div>
            )}
            {guest.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-200 text-xs">{guest.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="card flex flex-col items-center gap-3">
          <h3 className="font-semibold text-slate-200 self-start">QR Code</h3>
          {guest.qrImageUrl ? (
            <div className="bg-white p-3 rounded-xl">
              <img
                src={`${apiBase}${guest.qrImageUrl}`}
                alt="QR Code"
                width={180}
                height={180}
                className="block"
              />
            </div>
          ) : (
            <div className="w-44 h-44 bg-slate-700 rounded-xl flex items-center justify-center">
              <QrCode className="w-12 h-12 text-slate-500" />
            </div>
          )}
          <div className="flex gap-2 w-full">
            <button onClick={regenerateQR} className="btn-secondary flex-1 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Tengeneza Upya
            </button>
            <button onClick={() => window.print()} className="btn-secondary flex-1 text-xs no-print">
              <Printer className="w-3.5 h-3.5" /> Chapa
            </button>
          </div>
        </div>
      </div>

      {/* Scan history */}
      {guest.scans?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-3">Historia ya Skani</h3>
          <div className="space-y-2">
            {guest.scans.map((scan: Record<string, unknown>) => (
              <div key={String(scan.id)} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  scan.status === "SUCCESS" ? "bg-blue-400" : "bg-red-400"
                }`} />
                <span className="text-slate-400 flex-1">
                  {STATUS_LABELS[scan.status as string] ?? String(scan.status ?? "")}
                  {scan.staff ? ` · ${(scan.staff as Record<string, string>).name}` : ""}
                </span>
                <span className="text-slate-500 text-xs">
                  {formatDate(scan.createdAt as string, "dd MMM, HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
