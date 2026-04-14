"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Send, MessageSquare, Phone, CheckCircle2, XCircle,
  Clock, Search, Users, User, Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

type Channel = "WHATSAPP" | "SMS" | "BOTH";
type GuestType = "SINGLE" | "DOUBLE" | "FAMILY" | "VIP";

interface Event { id: string; name: string }
interface Guest { id: string; firstName: string; lastName: string; phone?: string; guestType: GuestType; eventId: string }
interface Message { id: string; phone: string; body: string; channel: string; status: string; createdAt: string; sender: { name: string } }

const TYPE_LABEL: Record<GuestType, string> = { SINGLE: "Mmoja", DOUBLE: "Wawili", FAMILY: "Familia", VIP: "VIP" };
const TYPE_COLOR: Record<GuestType, string> = { SINGLE: "badge-blue", DOUBLE: "badge-purple", FAMILY: "badge-green", VIP: "badge-yellow" };

const CHANNEL_OPTIONS: { value: Channel; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "SMS",       label: "SMS",         icon: <Phone className="w-4 h-4" />,          color: "border-blue-500 bg-blue-500/10 text-blue-400" },
  { value: "WHATSAPP",  label: "WhatsApp",    icon: <MessageSquare className="w-4 h-4" />,  color: "border-green-500 bg-blue-500/10 text-blue-400" },
  { value: "BOTH",      label: "SMS + WhatsApp", icon: <Send className="w-4 h-4" />,        color: "border-purple-500 bg-purple-500/10 text-purple-400" },
];

const MSG_STATUS_ICON: Record<string, React.ReactNode> = {
  SENT:    <CheckCircle2 className="w-4 h-4 text-blue-400" />,
  FAILED:  <XCircle className="w-4 h-4 text-red-400" />,
  PENDING: <Clock className="w-4 h-4 text-yellow-400" />,
};

export default function MessagesPage() {
  const { lang } = useLang();

  const { data: eventsData } = useSWR("/events", fetcher);
  const events: Event[] = eventsData?.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const eventId = selectedEventId || events[0]?.id || "";

  const { data: guestsData } = useSWR(eventId ? `/events/${eventId}/messages/guests` : null, fetcher);
  const { data: historyData, mutate: mutateHistory } = useSWR(eventId ? `/events/${eventId}/messages?pageSize=200` : null, fetcher);
  const { data: balanceData } = useSWR(eventId ? `/events/${eventId}/messages/balance` : null, fetcher);

  const guests: Guest[] = guestsData?.data ?? [];
  const history: Message[] = historyData?.data ?? [];
  const smsBalance = balanceData?.data ?? null;

  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [channel, setChannel] = useState<Channel>("SMS");
  const [message, setMessage] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "type" | "select">("all");
  const [selectedTypes, setSelectedTypes] = useState<Set<GuestType>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const filtered = useMemo(() => guests.filter((g) => {
    const q = search.toLowerCase();
    return !q || `${g.firstName} ${g.lastName} ${g.phone ?? ""}`.toLowerCase().includes(q);
  }), [guests, search]);

  const resolvedIds = useMemo(() => {
    if (recipientMode === "all") return guests.map((g) => g.id);
    if (recipientMode === "type") return guests.filter((g) => selectedTypes.has(g.guestType)).map((g) => g.id);
    return Array.from(selectedIds);
  }, [recipientMode, guests, selectedTypes, selectedIds]);

  const toggleType = (t: GuestType) => setSelectedTypes((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const toggleGuest = (id: string) => setSelectedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const send = async () => {
    if (!message.trim() || !eventId) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.post(`/events/${eventId}/messages/send`, { guestIds: resolvedIds, message, channel });
      setSendResult(res.data.data);
      await mutateHistory();
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  const T = {
    title:       { sw: "Ujumbe / SMS",      en: "Messages / SMS" },
    event:       { sw: "Chagua Tukio",      en: "Select Event" },
    compose:     { sw: "Tunga Ujumbe",      en: "Compose" },
    history:     { sw: "Historia",          en: "History" },
    channel:     { sw: "Njia ya Kutuma",    en: "Send via" },
    recipients:  { sw: "Wapokeaji",         en: "Recipients" },
    all:         { sw: "Wote",              en: "All" },
    byType:      { sw: "Aina",              en: "By Type" },
    pick:        { sw: "Chagua",            en: "Pick" },
    msgLabel:    { sw: "Ujumbe",            en: "Message" },
    sendBtn:     { sw: "Tuma",              en: "Send" },
    sending:     { sw: "Inatuma...",        en: "Sending..." },
    noHistory:   { sw: "Hakuna ujumbe",     en: "No messages yet" },
    balance:     { sw: "Salio la SMS",      en: "SMS Balance" },
    noPhone:     { sw: "Hakuna nambari",    en: "No phone" },
  };
  const t = (k: keyof typeof T) => T[k][lang];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t("title")}</h1>
        {smsBalance && (
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span>{t("balance")}: <strong className="text-slate-200">{smsBalance.display}</strong></span>
          </div>
        )}
      </div>

      {/* Event selector */}
      {events.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400 shrink-0">{t("event")}:</label>
          <select value={selectedEventId || eventId} onChange={(e) => setSelectedEventId(e.target.value)} className="flex-1 text-sm">
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-entron-dark-border">
        {([["compose", t("compose"), <Send key="s" className="w-4 h-4" />], ["history", t("history"), <MessageSquare key="m" className="w-4 h-4" />]] as [string, string, React.ReactNode][]).map(([key, label, icon]) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? "border-entron-blue text-entron-blue" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE ── */}
      {tab === "compose" && (
        <div className="space-y-4">

          {/* Channel */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">{t("channel")}</h2>
            <div className="grid grid-cols-3 gap-3">
              {CHANNEL_OPTIONS.map(({ value, label, icon, color }) => (
                <button key={value} onClick={() => setChannel(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${channel === value ? color : "border-entron-dark-border text-slate-400 hover:border-slate-500"}`}>
                  {icon}
                  <span className="text-xs font-medium text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-entron-blue" />{t("recipients")}
            </h2>
            <div className="flex gap-2 flex-wrap">
              {([["all", `${t("all")} (${guests.length})`], ["type", t("byType")], ["select", t("pick")]] as [string, string][]).map(([mode, label]) => (
                <button key={mode} onClick={() => setRecipientMode(mode as typeof recipientMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${recipientMode === mode ? "border-entron-blue bg-entron-blue/10 text-entron-blue" : "border-entron-dark-border text-slate-400"}`}>
                  {label}
                </button>
              ))}
            </div>

            {recipientMode === "type" && (
              <div className="flex flex-wrap gap-2">
                {(["SINGLE", "DOUBLE", "FAMILY", "VIP"] as GuestType[]).map((t2) => {
                  const count = guests.filter((g) => g.guestType === t2).length;
                  return (
                    <button key={t2} onClick={() => toggleType(t2)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedTypes.has(t2) ? "border-entron-blue bg-entron-blue/10 text-entron-blue" : "border-entron-dark-border text-slate-400"}`}>
                      {TYPE_LABEL[t2]} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {recipientMode === "select" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tafuta..." className="w-full pl-9 text-sm" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filtered.map((g) => (
                    <label key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/40 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleGuest(g.id)} className="accent-entron-blue" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{g.firstName} {g.lastName}</p>
                        {g.phone ? <p className="text-xs text-slate-500">{g.phone}</p> : <p className="text-xs text-red-400">{t("noPhone")}</p>}
                      </div>
                      <span className={`badge text-xs ${TYPE_COLOR[g.guestType]}`}>{TYPE_LABEL[g.guestType]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <strong className="text-slate-200">{resolvedIds.length}</strong> {lang === "sw" ? "watalopokea" : "will receive"}
            </p>
          </div>

          {/* Message */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">{t("msgLabel")}</h2>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="text-sm w-full"
              placeholder={lang === "sw" ? "Andika ujumbe hapa...\n\nTumia {{name}} kwa jina la mgeni" : "Write your message...\n\nUse {{name}} for guest name"} />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex gap-2">
                {["{{name}}", "{{firstName}}", "{{lastName}}"].map((v) => (
                  <button key={v} onClick={() => setMessage((m) => m + v)}
                    className="px-2 py-0.5 rounded bg-slate-700 font-mono hover:bg-slate-600 transition-colors">{v}</button>
                ))}
              </div>
              <span>{message.length} {lang === "sw" ? "herufi" : "chars"} · SMS: {Math.ceil(message.length / 160) || 1}</span>
            </div>
          </div>

          {/* Result */}
          {sendResult && (
            <div className={cn("card border", sendResult.failed === 0 ? "border-green-700/50" : "border-yellow-700/50")}>
              <div className="flex items-center gap-3">
                {sendResult.failed === 0 ? <CheckCircle2 className="w-5 h-5 text-blue-400" /> : <XCircle className="w-5 h-5 text-yellow-400" />}
                <p className="text-sm font-semibold text-slate-200">
                  {lang === "sw" ? "Zimetumwa" : "Sent"}: {sendResult.sent} · {lang === "sw" ? "Zimeshindwa" : "Failed"}: {sendResult.failed}
                </p>
              </div>
            </div>
          )}

          {/* Send button */}
          <button onClick={send} disabled={sending || !message.trim() || resolvedIds.length === 0} className="btn-primary w-full py-3">
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" />{t("sending")}</> : <><Send className="w-4 h-4" />{t("sendBtn")} ({resolvedIds.length})</>}
          </button>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-200">{t("history")} ({history.length})</h2>
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">{t("noHistory")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {history.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-entron-dark-border">
                  <div className="mt-0.5 shrink-0">{MSG_STATUS_ICON[msg.status] ?? <Clock className="w-4 h-4 text-slate-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs text-slate-400 font-mono">{msg.phone}</span>
                      <span className={`badge text-xs ${msg.channel === "WHATSAPP" ? "badge-green" : "badge-blue"}`}>
                        {msg.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}
                      </span>
                      <span className={`badge text-xs ${msg.status === "SENT" ? "badge-green" : msg.status === "FAILED" ? "badge-red" : "badge-yellow"}`}>
                        {msg.status === "SENT" ? (lang === "sw" ? "Imetumwa" : "Sent") : msg.status === "FAILED" ? (lang === "sw" ? "Imeshindwa" : "Failed") : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{msg.body}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {msg.sender?.name} · {new Date(msg.createdAt).toLocaleString(lang === "sw" ? "sw-TZ" : "en-GB", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
