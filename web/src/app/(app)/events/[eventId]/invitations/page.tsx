"use client";
import { use, useState, useRef, useCallback, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft, Upload, Download, Send, Trash2,
  Move, Type, QrCode, Check, RefreshCw, ImageIcon, X, FileSpreadsheet, Loader2,
} from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

interface FieldDef { x: number; y: number; size: number; color?: string }
interface Fields { guestName: FieldDef; qrCode: FieldDef }
interface Template { id: string; name: string; fileUrl: string; fields: Fields }

const DEFAULT_FIELDS: Fields = {
  guestName: { x: 120, y: 160, size: 48, color: "#ffffff" },
  qrCode:    { x: 120, y: 300, size: 200 },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-yellow", SENT: "badge-blue",
  DELIVERED: "badge-green", READ: "badge-purple", FAILED: "badge-red",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Inasubiri", SENT: "Imetumwa",
  DELIVERED: "Imepokelewa", READ: "Imesomwa", FAILED: "Imeshindwa",
};
const TYPE_LABEL: Record<string, string> = { SINGLE: "Mmoja", DOUBLE: "Wawili", FAMILY: "Familia", VIP: "VIP" };
const TYPE_COLOR: Record<string, string> = { SINGLE: "badge-blue", DOUBLE: "badge-purple", FAMILY: "badge-green", VIP: "badge-yellow" };

// ─── Template Designer ─────────────────────────────────────────────────────
function TemplateDesigner({
  imageUrl, fields, onChange,
}: { imageUrl: string; fields: Fields; onChange: (f: Fields) => void }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const drag = useRef<{ key: keyof Fields; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const scale = useCallback(() => {
    if (!imgRef.current) return { x: 1, y: 1 };
    const r = imgRef.current.getBoundingClientRect();
    return { x: natural.w / r.width, y: natural.h / r.height };
  }, [natural]);

  const toDisplay = useCallback((nx: number, ny: number) => {
    if (!imgRef.current) return { x: nx, y: ny };
    const r = imgRef.current.getBoundingClientRect();
    return { x: nx / (natural.w / r.width), y: ny / (natural.h / r.height) };
  }, [natural]);

  const onMove = useCallback((e: PointerEvent) => {
    if (!drag.current) return;
    const s = scale();
    onChange({
      ...fields,
      [drag.current.key]: {
        ...fields[drag.current.key],
        x: Math.max(0, Math.round(drag.current.ox + (e.clientX - drag.current.sx) * s.x)),
        y: Math.max(0, Math.round(drag.current.oy + (e.clientY - drag.current.sy) * s.y)),
      },
    });
  }, [scale, fields, onChange]);

  const onUp = useCallback(() => { drag.current = null; }, []);
  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [onMove, onUp]);

  const np = toDisplay(fields.guestName.x, fields.guestName.y);
  const qp = toDisplay(fields.qrCode.x, fields.qrCode.y);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">Buruta alama kwenye picha kuweka nafasi</p>
      <div className="relative w-full rounded-xl overflow-hidden border border-entron-dark-border bg-slate-900 select-none">
        <img ref={imgRef} src={imageUrl} alt="template" className="w-full block" draggable={false}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />

        {/* Name handle */}
        <div className="absolute flex items-center gap-1.5 bg-black/75 border-2 border-entron-blue text-white rounded-lg px-2 py-1 cursor-grab active:cursor-grabbing touch-none z-10"
          style={{ left: np.x, top: np.y, transform: "translate(-50%,-50%)" }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as Element).setPointerCapture(e.pointerId);
            drag.current = { key: "guestName", sx: e.clientX, sy: e.clientY, ox: fields.guestName.x, oy: fields.guestName.y };
          }}>
          <Type className="w-3.5 h-3.5 text-entron-blue shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap">Jina</span>
          <Move className="w-3 h-3 text-slate-300 shrink-0" />
        </div>

        {/* QR handle */}
        <div className="absolute flex items-center gap-1.5 bg-black/75 border-2 border-blue-400 text-white rounded-lg px-2 py-1 cursor-grab active:cursor-grabbing touch-none z-10"
          style={{ left: qp.x, top: qp.y, transform: "translate(-50%,-50%)" }}
          onPointerDown={(e) => {
            e.preventDefault();
            (e.target as Element).setPointerCapture(e.pointerId);
            drag.current = { key: "qrCode", sx: e.clientX, sy: e.clientY, ox: fields.qrCode.x, oy: fields.qrCode.y };
          }}>
          <QrCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap">QR Code</span>
          <Move className="w-3 h-3 text-slate-300 shrink-0" />
        </div>
      </div>

      {/* Controls */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Type className="w-4 h-4 text-entron-blue" /> Jina
          </p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Ukubwa: {fields.guestName.size}px</label>
            <input type="range" min={16} max={120} value={fields.guestName.size} className="w-full accent-entron-blue"
              onChange={(e) => onChange({ ...fields, guestName: { ...fields.guestName, size: +e.target.value } })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={fields.guestName.color ?? "#ffffff"}
              className="w-10 h-8 rounded cursor-pointer border border-slate-600 bg-transparent"
              onChange={(e) => onChange({ ...fields, guestName: { ...fields.guestName, color: e.target.value } })} />
            <span className="text-xs text-slate-400 font-mono">{fields.guestName.color ?? "#ffffff"}</span>
          </div>
        </div>
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-400" /> QR Code
          </p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Ukubwa: {fields.qrCode.size}px</label>
            <input type="range" min={80} max={400} value={fields.qrCode.size} className="w-full accent-blue-400"
              onChange={(e) => onChange({ ...fields, qrCode: { ...fields.qrCode, size: +e.target.value } })} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function InvitationsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data: templateData, mutate: mutateTemplates } = useSWR(`/events/${eventId}/invitations/templates`, fetcher);
  const { data: invData, mutate: mutateInv } = useSWR(`/events/${eventId}/invitations?pageSize=500`, fetcher);

  const templates: Template[] = templateData?.data ?? [];
  const guests: Record<string, unknown>[] = invData?.data ?? [];
  const template = templates[0] ?? null;

  // ── Step states ──
  const [step, setStep] = useState<"template" | "excel" | "done">("template");

  // ── Template designer ──
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fields, setFields] = useState<Fields>(DEFAULT_FIELDS);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // ── Excel import ──
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  // ── Card generation ──
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ generated: number; failed: number } | null>(null);

  // ── WhatsApp ──
  const [message, setMessage] = useState("Karibu {{name}}! Tunafurahi kukualika kwenye tukio letu.");
  const [sending, setSending] = useState(false);

  // Sync step from data
  useEffect(() => {
    if (template && guests.length > 0) setStep("done");
    else if (template) setStep("excel");
    else setStep("template");
  }, [template, guests.length]);

  const openEditor = (t?: Template) => {
    if (t) { setFields(t.fields ?? DEFAULT_FIELDS); setPreviewUrl(t.fileUrl); setPendingFile(null); }
    setStep("template");
  };

  const saveTemplate = async () => {
    setSavingTemplate(true);
    try {
      if (pendingFile) {
        if (template) await api.delete(`/events/${eventId}/invitations/templates/${template.id}`);
        const form = new FormData();
        form.append("file", pendingFile);
        form.append("name", pendingFile.name);
        form.append("fields", JSON.stringify(fields));
        await api.post(`/events/${eventId}/invitations/templates`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (template) {
        await api.patch(`/events/${eventId}/invitations/templates/${template.id}`, { fields });
      }
      await mutateTemplates();
      setPendingFile(null);
      setStep("excel");
    } finally {
      setSavingTemplate(false);
    }
  };

  const importExcel = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(`/events/${eventId}/guests/import`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { imported, skipped } = res.data.data;
      setImportResult({ imported, skipped });
      await mutateInv();
      // Auto-generate cards immediately
      await generateCards();
    } finally {
      setImporting(false);
    }
  };

  const generateCards = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const fresh = await api.get(`/events/${eventId}/invitations?pageSize=500`);
      const allGuests: Record<string, unknown>[] = fresh.data?.data ?? [];
      const guestIds = allGuests.map((g) => g.id as string);
      if (!guestIds.length) return;
      const res = await api.post(`/events/${eventId}/invitations/generate`, {
        templateId: template?.id ?? null,
        guestIds,
      });
      setGenResult(res.data.data);
      await mutateInv();
      setStep("done");
    } finally {
      setGenerating(false);
    }
  };

  const sendBulk = async () => {
    setSending(true);
    try {
      const guestIds = guests
        .filter((g) => (g.invitations as Array<Record<string, unknown>>)?.[0]?.cardUrl)
        .map((g) => g.id as string);
      const res = await api.post(`/events/${eventId}/whatsapp/send-bulk`, { guestIds, message, includeCard: true });
      alert(`Zimetumwa: ${res.data.data.sent}, Zimeshindwa: ${res.data.data.failed}`);
    } finally {
      setSending(false);
    }
  };

  const cardsReady = guests.filter((g) => (g.invitations as Array<Record<string, unknown>>)?.[0]?.cardUrl);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/events/${eventId}`} className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title flex-1">Mialiko</h1>
        {cardsReady.length > 0 && (
          <a href={`/api/v1/events/${eventId}/invitations/download-zip`} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> ZIP ({cardsReady.length})
          </a>
        )}
      </div>

      {/* ── STEP 1: Template ── */}
      <div className={`card space-y-4 ${step === "template" ? "ring-2 ring-entron-blue/40" : ""}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-entron-blue text-white text-xs flex items-center justify-center font-bold">1</span>
            Pakia Templeti ya Kadi
          </h2>
          {template && step !== "template" && (
            <button onClick={() => openEditor(template)} className="btn-secondary text-xs">
              <Move className="w-3.5 h-3.5" /> Hariri
            </button>
          )}
        </div>

        {/* No template yet — dropzone */}
        {!template && !previewUrl && (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-entron-dark-border rounded-xl py-10 cursor-pointer hover:border-entron-blue/50 transition-colors">
            <ImageIcon className="w-10 h-10 text-slate-500 mb-3" />
            <p className="text-slate-300 font-medium">Bonyeza kupakia picha ya templeti</p>
            <p className="text-slate-500 text-sm mt-1">PNG au JPG — muundo wa kadi yako</p>
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setPendingFile(f); setPreviewUrl(URL.createObjectURL(f)); }} />
          </label>
        )}

        {/* Designer open */}
        {previewUrl && step === "template" && (
          <div className="space-y-4">
            <TemplateDesigner imageUrl={previewUrl} fields={fields} onChange={setFields} />
            <div className="flex gap-3">
              <button onClick={saveTemplate} disabled={savingTemplate} className="btn-primary flex-1">
                <Check className="w-4 h-4" />
                {savingTemplate ? "Inahifadhi..." : "Hifadhi na Endelea"}
              </button>
              {template && (
                <button onClick={() => { setPreviewUrl(null); setPendingFile(null); setStep("excel"); }} className="btn-secondary">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Template saved — compact preview */}
        {template && step !== "template" && (
          <div className="flex items-center gap-3">
            <img src={template.fileUrl} alt="template" className="w-20 h-auto rounded-lg border border-entron-dark-border object-cover" />
            <div className="text-sm space-y-1">
              <p className="text-slate-200 font-medium">{template.name}</p>
              <p className="text-xs text-slate-500">
                Jina: x={template.fields?.guestName?.x}, y={template.fields?.guestName?.y} · QR: x={template.fields?.qrCode?.x}, y={template.fields?.qrCode?.y}
              </p>
              <span className="badge badge-green text-xs flex items-center gap-1 w-fit">
                <Check className="w-3 h-3" /> Imehifadhiwa
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 2: Excel Upload ── */}
      {template && (
        <div className={`card space-y-4 ${step === "excel" ? "ring-2 ring-entron-blue/40" : ""}`}>
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-entron-blue text-white text-xs flex items-center justify-center font-bold">2</span>
            Pakia Faili ya Excel (Wageni)
          </h2>

          {/* Column guide */}
          <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300 mb-2">Safu zinazohitajika kwenye Excel:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ["firstName", "Jina la kwanza (lazima)"],
                ["lastName", "Jina la ukoo (lazima)"],
                ["phone", "Nambari ya simu"],
                ["guestType", "SINGLE / DOUBLE / FAMILY / VIP"],
                ["tableNumber", "Nambari ya meza"],
                ["seatNumber", "Nambari ya kiti"],
                ["email", "Barua pepe"],
                ["notes", "Maelezo"],
              ].map(([col, desc]) => (
                <div key={col} className="flex gap-1.5">
                  <span className="font-mono text-entron-blue">{col}</span>
                  <span className="text-slate-500">— {desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Import result */}
          {importResult && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-3 text-sm flex items-center gap-3">
              <Check className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-green-300">
                Wageni <strong>{importResult.imported}</strong> wameingizwa.
                {importResult.skipped > 0 && ` (${importResult.skipped} wamerukwa)`}
              </span>
            </div>
          )}

          {/* Drop zone */}
          <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors ${importing ? "border-entron-blue/50 bg-entron-blue/5" : "border-entron-dark-border hover:border-entron-blue/50"}`}>
            {importing ? (
              <>
                <Loader2 className="w-8 h-8 text-entron-blue animate-spin mb-2" />
                <p className="text-slate-300 text-sm">Inaingiza wageni na kuunda kadi...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-10 h-10 text-slate-500 mb-3" />
                <p className="text-slate-300 font-medium">Bonyeza kupakia Excel</p>
                <p className="text-slate-500 text-sm mt-1">.xlsx au .xls</p>
                {guests.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">Wageni wa sasa: {guests.length} — faili mpya itaongeza zaidi</p>
                )}
              </>
            )}
            <input type="file" accept=".xlsx,.xls" className="hidden" disabled={importing}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importExcel(f); }} />
          </label>

          {/* Manual regenerate if guests exist */}
          {guests.length > 0 && !importing && (
            <div className="flex items-center gap-3 pt-1">
              <button onClick={generateCards} disabled={generating} className="btn-secondary text-sm">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {generating ? "Inaunda kadi..." : `Tengeneza Kadi Tena (${guests.length})`}
              </button>
              {genResult && (
                <span className="text-xs text-slate-400">
                  {genResult.generated} zimeundwa, {genResult.failed} zimeshindwa
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Cards Gallery ── */}
      {cardsReady.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-entron-blue text-white text-xs flex items-center justify-center font-bold">3</span>
              Kadi Tayari ({cardsReady.length}/{guests.length})
            </h2>
            <a href={`/api/v1/events/${eventId}/invitations/download-zip`} className="btn-secondary text-xs">
              <Download className="w-3.5 h-3.5" /> Pakua Zote
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cardsReady.map((g) => {
              const inv = (g.invitations as Array<Record<string, unknown>>)[0];
              const cardUrl = inv.cardUrl as string;
              const status = inv.status as string;
              const gType = g.guestType as string;
              return (
                <div key={String(g.id)} className="group relative rounded-xl overflow-hidden border border-entron-dark-border bg-slate-800">
                  <img src={cardUrl} alt={`${g.firstName} ${g.lastName}`} className="w-full aspect-[3/4] object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <a href={cardUrl} download={`${g.firstName}-${g.lastName}.jpg`}
                      className="btn-primary text-xs w-full justify-center">
                      <Download className="w-3.5 h-3.5" /> Pakua
                    </a>
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-xs text-slate-200 font-medium truncate">{g.firstName as string} {g.lastName as string}</p>
                    <div className="flex gap-1 flex-wrap">
                      <span className={`badge text-xs ${TYPE_COLOR[gType] ?? "badge-blue"}`}>{TYPE_LABEL[gType] ?? gType}</span>
                      <span className={`badge text-xs ${STATUS_COLORS[status] ?? "badge-yellow"}`}>{STATUS_LABELS[status] ?? status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WhatsApp Send ── */}
      {cardsReady.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <Send className="w-4 h-4 text-entron-blue" /> Tuma WhatsApp
          </h2>
          <div className="input-group">
            <label>Ujumbe (tumia {"{{name}}"} kwa jina la mgeni)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="text-sm" />
          </div>
          <button onClick={sendBulk} disabled={sending} className="btn-primary w-full">
            <Send className="w-4 h-4" />
            {sending ? "Inatuma..." : `Tuma kwa Wageni Wote (${cardsReady.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
