"use client";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { useEventStore } from "@/store/eventStore";

export default function ScannerLandingPage() {
  const { activeEvent } = useEventStore();

  if (!activeEvent) {
    return (
      <div className="text-center py-16">
        <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 mb-2">Select an event first to start scanning</p>
        <Link href="/events" className="btn-primary inline-flex">Go to Events</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <QrCode className="w-16 h-16 text-entron-blue mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Ready to Scan</h1>
        <p className="text-slate-400">{activeEvent.name}</p>
        <p className="text-sm text-slate-500">{activeEvent.venue}</p>
      </div>
      <Link href={`/events/${activeEvent.id}/scan`} className="btn-primary btn-lg px-12">
        Start Scanning
      </Link>
      <Link href="/events" className="text-sm text-slate-400 hover:text-slate-200">
        Change Event
      </Link>
    </div>
  );
}
