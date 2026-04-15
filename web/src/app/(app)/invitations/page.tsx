"use client";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useEventStore } from "@/store/eventStore";

export default function InvitationsPage() {
  const { activeEvent } = useEventStore();

  if (!activeEvent) {
    return (
      <div className="text-center py-16">
        <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 mb-2">Select an event first</p>
        <Link href="/events" className="btn-primary inline-flex">Go to Events</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title mb-2">Invitations</h1>
      <p className="text-slate-400 mb-6">Event: {activeEvent.name}</p>
      <Link href={`/events/${activeEvent.id}/invitations`} className="btn-primary">
        Manage Invitations for {activeEvent.name}
      </Link>
    </div>
  );
}
