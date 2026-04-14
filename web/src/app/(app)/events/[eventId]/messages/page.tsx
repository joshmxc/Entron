"use client";
import { use, useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft, Send, MessageSquare, Phone, CheckCircle2,
  XCircle, Clock, Search, Users, User, Filter,
} from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

type Channel = "WHATSAPP" | "SMS" | "BOTH";
type GuestType = "SINGLE" | "DOUBLE" | "FAMILY" | "VIP";

const CHANNEL_OPTIONS: { value: Channel; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp", icon: <MessageSquare className="w-4 h-4" />, color: "border-green-500 bg-blue-500/10 text-blue-400" },
  { value: "SMS",       label: "SMS",      icon: <Phone className="w-4 h-4" />,          color: "border-blue-500 bg-blue-500/10 text-blue-400" },
  { value: "BOTH",      label: "Vyote Viwili", icon: <Send className="w-4 h-4" />,       color: "border-purple-500 bg-purple-500/10 text-purple-400" },
];

const TYPE_LABEL: Record<GuestType, string> = { SINGLE: "Mmoja", DOUBLE: "Wawili", FAMILY: "Familia", VIP: "VIP" };
const TYPE_COLOR: Record<GuestType, string> = { SINGLE: "badge-blue", DOUBLE: "badge-purple", FAMILY: "badge-green", VIP: "badge-yellow" };

const MSG_STATUS_ICON: Record<string, React.ReactNode> = {
  SENT:    <CheckCircle2 className="w-4 h-4 text-blue-400" />,
  FAILED:  <XCircle className="w-4 h-4 text-red-400" />,
  PENDING: <Clock className="w-4 h-4 text-yellow-400" />,
};

interface Guest { id: string; firstName: string; lastName: string; phone?: string; guestType: GuestType }
interface Message { id: string; phone: string; body: string; channel: string; status: string; createdAt: string; sender: { name: string } }

export default function MessagesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data: guestsData } = useSWR(`/events/${eventId}/messages/guests`, fetcher);
  const { data: historyData, mutate: mutateHistory } = useSWR(`/events/${eventId}/messages?pageSize=100`, fetcher);
  const { data: balanceData } = useSWR(`/events/${eventId}/messages/balance`, fetcher);

  const guests: Guest[] = guestsData?.data ?? [];
  const history: Message[] = historyData?.data ?? [];

  // ── Compose state ──
  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [channel, setChannel] = useState<Channel>("WHATSAPP");
  const [message, setMessage] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "type" | "select">("all");
  const [selectedTypes, setSelectedTypes] = useState<Set<GuestType>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; details: { name: string; phone: string; status: string; channel: string }[] } | null>(null);

  // ── Filtered guest list ──
  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const q = search.toLowerCase();
      return !q || `${g.firstName} ${g.lastName} ${g.phone ?? ""}`.toLowerCase().includes(q);
    });
  }, [guests, search]);

  const resolvedIds = useMemo(() => {
    if (recipientMode === "all") return guests.map((g) => g.id);
    if (recipientMode === "type") return guests.filter((g) => selectedTypes.has(g.guestType)).map((g) => g.id);
    return Array.from(selectedIds);
  }, [recipientMode, guests, selectedTypes, selectedIds]);

  const guestsWithPhone = guests.filter((g) => g.phone).length;
  const smsBalance: { balance: number; display: string; channel: string } | null = balanceData?.data ?? null;

  const toggleType = (t: GuestType) => setSelectedTypes((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const toggleGuest = (id: string) => setSelectedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.post(`/events/${eventId}/messages/send`, {
        guestIds: resolvedIds,
        message,
        channel,
      });
      setSendResult(res.data.data);
      await mutateHistory();
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const smsPages = Math.ceil(charCount / 160) || 1;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/events/${eventId}`} className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title flex-1">Ujumbe</h1>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{guestsWithPhone}/{guests.length} wana nambari</span>
          {smsBalance && (
            <span className="badge badge-green">SMS: {smsBalance.display}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-entron-dark-border">
        {[
          { key: "compose", label: "Tunga Ujumbe", icon: <Send className="w-4 h-4" /> },
          { key: "history", label: "Historia", icon: <MessageSquare className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? "border-entron-blue text-entron-blue" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE ── */}
      {tab === "compose" && (
        <div className="space-y-5">

          {/* Channel selector */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-slate-200 text-sm">Njia ya Kutuma</h2>
            <div className="grid grid-cols-3 gap-3">
              {CHANNEL_OPTIONS.map(({ value, label, icon, color }) => (
                <button key={value} onClick={() => setChannel(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${channel === value ? color : "border-entron-dark-border text-slate-400 hover:border-slate-500"}`}>
                  {icon}
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
            {channel === "SMS" && (
              <p className="text-xs text-slate-500">
                Itatumia Africa&apos;s Talking SMS. Hakikisha nambari za simu zina nchi (255...).
              </p>
            )}
            {channel === "BOTH" && (
              <p className="text-xs text-slate-500">
                Kila mgeni atapokea WhatsApp na SMS zote mbili.
              </p>
            )}
          </div>

          {/* Recipients */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-entron-blue" /> Wapokeaji
            </h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { mode: "all",    label: `Wageni Wote (${guests.length})` },
                { mode: "type",   label: "Chagua Aina" },
                { mode: "select", label: "Chagua Mmoja Mmoja" },
              ].map(({ mode, label }) => (
                <button key={mode} onClick={() => setRecipientMode(mode as typeof recipientMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${recipientMode === mode ? "border-entron-blue bg-entron-blue/10 text-entron-blue" : "border-entron-dark-border text-slate-400 hover:border-slate-500"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* By type */}
            {recipientMode === "type" && (
              <div className="flex flex-wrap gap-2 pt-1">
                {(["SINGLE", "DOUBLE", "FAMILY", "VIP"] as GuestType[]).map((t) => {
                  const count = guests.filter((g) => g.guestType === t).length;
                  return (
                    <button key={t} onClick={() => toggleType(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedTypes.has(t) ? "border-entron-blue bg-entron-blue/10 text-entron-blue" : "border-entron-dark-border text-slate-400"}`}>
                      {TYPE_LABEL[t]} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Individual select */}
            {recipientMode === "select" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tafuta mgeni..."
                    className="w-full pl-9 text-sm" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filtered.map((g) => (
                    <label key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/40 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleGuest(g.id)}
                        className="rounded border-slate-600 accent-entron-blue" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{g.firstName} {g.lastName}</p>
                        {g.phone ? <p className="text-xs text-slate-500">{g.phone}</p> : <p className="text-xs text-red-400">Hakuna nambari</p>}
                      </div>
                      <span className={`badge text-xs ${TYPE_COLOR[g.guestType]}`}>{TYPE_LABEL[g.guestType]}</span>
                    </label>
                  ))}
                </div>
                {selectedIds.size > 0 && (
                  <p className="text-xs text-entron-blue">{selectedIds.size} wamechaguliwa</p>
                )}
              </div>
            )}

            {/* Count summary */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
              <User className="w-3.5 h-3.5" />
              <span>Ujumbe utatumwa kwa wageni <strong className="text-slate-200">{resolvedIds.length}</strong></span>
            </div>
          </div>

          {/* Message composer */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-slate-200 text-sm">Ujumbe</h2>
            <div className="space-y-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Andika ujumbe hapa...&#10;&#10;Unaweza kutumia:&#10;{{name}} — jina kamili&#10;{{firstName}} — jina la kwanza&#10;{{lastName}} — jina la ukoo"
                rows={5}
                className="text-sm w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 px-1">
                <span>Herufi: {charCount}</span>
                {(channel === "SMS" || channel === "BOTH") && (
                  <span>SMS: {smsPages} {smsPages === 1 ? "ukurasa" : "kurasa"} (~{smsPages * 160} herufi max)</span>
                )}
              </div>
            </div>

            {/* Variables quick-insert */}
            <div className="flex gap-2 flex-wrap">
              {["{{name}}", "{{firstName}}", "{{lastName}}"].map((v) => (
                <button key={v} onClick={() => setMessage((m) => m + v)}
                  className="px-2 py-1 rounded bg-slate-700 text-xs text-slate-300 font-mono hover:bg-slate-600 transition-colors">
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Send result */}
          {sendResult && (
            <div className={`card border ${sendResult.failed === 0 ? "border-green-700/50" : "border-yellow-700/50"} space-y-3`}>
              <div className="flex items-center gap-3">
                {sendResult.failed === 0
                  ? <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                  : <XCircle className="w-5 h-5 text-yellow-400 shrink-0" />}
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Zimetumwa: {sendResult.sent} · Zimeshindwa: {sendResult.failed}
                  </p>
                  <p className="text-xs text-slate-400">Tazama historia kwa maelezo zaidi</p>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {sendResult.details.filter((d) => d.status !== "Imetumwa").map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-red-400">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    {d.name} ({d.phone}) — {d.status}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send button */}
          <button onClick={send} disabled={sending || !message.trim() || resolvedIds.length === 0}
            className="btn-primary w-full py-3">
            {sending ? (
              <><span className="animate-pulse">Inatuma...</span></>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Tuma kwa {resolvedIds.length} {recipientMode !== "all" ? "waliochaguliwa" : "wageni wote"}
                {channel === "BOTH" ? " (WhatsApp + SMS)" : ` (${channel})`}
              </>
            )}
          </button>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-200">Historia ya Ujumbe ({history.length})</h2>
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Hakuna ujumbe uliotumwa bado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {history.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-entron-dark-border">
                  <div className="mt-0.5 shrink-0">
                    {MSG_STATUS_ICON[msg.status] ?? <Clock className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs text-slate-400 font-mono">{msg.phone}</span>
                      <span className={`badge text-xs ${msg.channel === "WHATSAPP" ? "badge-green" : "badge-blue"}`}>
                        {msg.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}
                      </span>
                      <span className={`badge text-xs ${msg.status === "SENT" ? "badge-green" : msg.status === "FAILED" ? "badge-red" : "badge-yellow"}`}>
                        {msg.status === "SENT" ? "Imetumwa" : msg.status === "FAILED" ? "Imeshindwa" : "Inasubiri"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{msg.body}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{msg.sender?.name}</span>
                      <span>·</span>
                      <span>{new Date(msg.createdAt).toLocaleString("sw-TZ", { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
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
