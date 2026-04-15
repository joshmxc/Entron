"use client";
import { use, useState, useRef, useCallback, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft, Download, Send, Eye,
  Move, Type, QrCode, Check, RefreshCw, ImageIcon, X, FileSpreadsheet, Loader2,
} from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

// ── Types ─────────────────────────────────────────────────────────────────────
interface FieldDef { x: number; y: number; size: number; color?: string }
interface Fields   { guestName: FieldDef; qrCode: FieldDef }
interface Template { id: string; name: string; fileUrl: string; fields: Fields }

interface GuestRow {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  guestType: string;
  invitations?: Array<{ id?: string; cardUrl?: string | null; status?: string }>;
}

const DEFAULT_FIELDS: Fields = {
  guestName: { x: 120, y: 160, size: 48, color: "#ffffff" },
  qrCode:    { x: 120, y: 300, size: 200 },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-yellow", SENT: "badge-blue",
  DELIVERED: "badge-green", READ: "badge-purple", FAILED: "badge-red",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", SENT: "Sent",
  DELIVERED: "Delivered", READ: "Read", FAILED: "Failed",
};
const TYPE_LABEL: Record<string, string> = { SINGLE: "Single", DOUBLE: "Double", FAMILY: "Family", VIP: "VIP" };
const TYPE_COLOR: Record<string, string>  = { SINGLE: "badge-blue", DOUBLE: "badge-purple", FAMILY: "badge-green", VIP: "badge-yellow" };

// ─── Template Designer ────────────────────────────────────────────────────────
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
      <p className="text-xs text-slate-400">Drag handles on the image to position elements</p>
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
          <span className="text-xs font-medium whitespace-nowrap">Name</span>
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
            <Type className="w-4 h-4 text-entron-blue" /> Guest Name
          </p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Size: {fields.guestName.size}px</label>
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
            <label className="text-xs text-slate-400 mb-1 block">Size: {fields.qrCode.size}px</label>
            <input type="range" min={80} max={400} value={fields.qrCode.size} className="w-full accent-blue-400"
              onChange={(e) => onChange({ ...fields, qrCode: { ...fields.qrCode, size: +e.target.value } })} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Merge Preview Modal ──────────────────────────────────────────────────────
function MergePreviewModal({
  template,
  guests,
  onClose,
  onGenerateAll,
  generating,
}: {
  template: Template;
  guests: GuestRow[];
  onClose: () => void;
  onGenerateAll: () => void;
  generating: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedId, setSelectedId] = useState(guests[0]?.id ?? "");
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState(false);

  const guest = guests.find((g) => g.id === selectedId) ?? guests[0];

  // Re-draw canvas whenever the selected guest or template changes
  useEffect(() => {
    if (!canvasRef.current || !guest || !template) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRendering(true);
    setRenderError(false);

    const templateImg = new Image();

    templateImg.onload = async () => {
      // Set canvas to full template resolution
      canvas.width  = templateImg.naturalWidth;
      canvas.height = templateImg.naturalHeight;

      // 1. Draw template image as background
      ctx.drawImage(templateImg, 0, 0);

      // 2. Draw QR code at configured position/size
      const { x: qx, y: qy, size: qSize } = template.fields.qrCode;
      try {
        const qrDataUrl = await QRCode.toDataURL(`entron:${guest.id}`, {
          width: qSize,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
        await new Promise<void>((resolve) => {
          const qrImg = new Image();
          qrImg.onload  = () => { ctx.drawImage(qrImg, qx, qy, qSize, qSize); resolve(); };
          qrImg.onerror = () => resolve();
          qrImg.src     = qrDataUrl;
        });
      } catch {
        // Fallback: draw a white placeholder box
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qx, qy, qSize, qSize);
        ctx.fillStyle = "#aaaaaa";
        ctx.font = `${Math.max(12, qSize / 8)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("QR", qx + qSize / 2, qy + qSize / 2 + 4);
        ctx.textAlign = "left";
      }

      // 3. Draw guest name at configured position/size/color
      const { x: nx, y: ny, size: nSize, color: nColor } = template.fields.guestName;
      ctx.font         = `bold ${nSize}px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle    = nColor ?? "#ffffff";
      ctx.textBaseline = "top";
      ctx.textAlign    = "left";
      ctx.fillText(`${guest.firstName} ${guest.lastName}`, nx, ny);

      setRendering(false);
    };

    templateImg.onerror = () => { setRendering(false); setRenderError(true); };
    templateImg.src = template.fileUrl;
  }, [guest, template]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h2 className="font-bold text-slate-100 flex items-center gap-2 text-base">
            <Eye className="w-5 h-5 text-entron-blue" />
            Data Merge Preview
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest selector */}
        <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 shrink-0">Preview guest:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 text-sm"
          >
            {guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.firstName} {g.lastName}
                {g.guestType ? ` — ${TYPE_LABEL[g.guestType] ?? g.guestType}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Canvas preview area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center relative min-h-[200px]">
          {rendering && !renderError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-9 h-9 text-entron-blue animate-spin" />
              <p className="text-xs text-slate-400">Rendering preview...</p>
            </div>
          )}
          {renderError && (
            <div className="text-center text-slate-400 space-y-2">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm">Could not load template image.</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="max-w-full rounded-lg shadow-2xl"
            style={{
              maxHeight: "50vh",
              objectFit: "contain",
              opacity: rendering || renderError ? 0 : 1,
              transition: "opacity 0.25s ease",
            }}
          />
        </div>

        {/* Info strip */}
        {guest && !renderError && (
          <div className="px-5 py-2 bg-slate-800/60 border-t border-slate-700 text-xs text-slate-400 flex flex-wrap gap-x-5 gap-y-1 shrink-0">
            <span>Guest: <strong className="text-slate-200">{guest.firstName} {guest.lastName}</strong></span>
            <span>Name pos: x={template.fields.guestName.x}, y={template.fields.guestName.y}</span>
            <span>Font: {template.fields.guestName.size}px</span>
            <span>QR pos: x={template.fields.qrCode.x}, y={template.fields.qrCode.y}</span>
          </div>
        )}

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-slate-700 flex gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">
            <X className="w-4 h-4" /> Close
          </button>
          <button
            onClick={() => { onClose(); onGenerateAll(); }}
            disabled={generating}
            className="btn-primary flex-1 text-sm"
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              : <><Check className="w-4 h-4" /> Generate All ({guests.length})</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InvitationsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  const { data: templateData, mutate: mutateTemplates } = useSWR(`/events/${eventId}/invitations/templates`, fetcher);
  const { data: invData,      mutate: mutateInv        } = useSWR(`/events/${eventId}/invitations?pageSize=500`, fetcher);

  const templates: Template[]  = templateData?.data ?? [];
  const guests: GuestRow[]     = (invData?.data ?? []) as GuestRow[];
  const template: Template | null = templates[0] ?? null;

  const [step,          setStep]          = useState<"template" | "excel" | "done">("template");
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null);
  const [pendingFile,   setPendingFile]   = useState<File | null>(null);
  const [fields,        setFields]        = useState<Fields>(DEFAULT_FIELDS);
  const [savingTemplate,setSavingTemplate]= useState(false);
  const [importing,     setImporting]     = useState(false);
  const [importResult,  setImportResult]  = useState<{ imported: number; skipped: number } | null>(null);
  const [generating,    setGenerating]    = useState(false);
  const [genResult,     setGenResult]     = useState<{ generated: number; failed: number } | null>(null);
  const [message,       setMessage]       = useState("Hello {{name}}! We are pleased to invite you to our event.");
  const [sending,       setSending]       = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);

  // Determine the starting step from server data ONCE on initial load only.
  // After that, step is driven explicitly by saveTemplate / importExcel / etc.
  // Using a ref instead of running on every data change prevents the step from
  // resetting to "template" when SWR briefly clears its cache during a refetch.
  const stepInitialized = useRef(false);
  useEffect(() => {
    if (stepInitialized.current) return;   // already set — don't override
    if (templateData === undefined) return; // SWR still loading, wait
    stepInitialized.current = true;
    if (template && guests.length > 0) setStep("done");
    else if (template) setStep("excel");
    // else: stay on "template" (already the initial value)
  }, [templateData, template, guests.length]);

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
      setPreviewUrl(null); // clear local blob URL — template.fileUrl is now the saved one
      setStep("excel");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Import Excel — does NOT auto-generate so user can preview first
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
      // Automatically open preview after a successful import so user can verify
      if (imported > 0) setShowPreview(true);
    } finally {
      setImporting(false);
    }
  };

  const generateCards = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const fresh      = await api.get(`/events/${eventId}/invitations?pageSize=500`);
      const allGuests  = (fresh.data?.data ?? []) as GuestRow[];
      const guestIds   = allGuests.map((g) => g.id);
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
        .filter((g) => g.invitations?.[0]?.cardUrl)
        .map((g) => g.id);
      const res = await api.post(`/events/${eventId}/whatsapp/send-bulk`, { guestIds, message, includeCard: true });
      alert(`Sent: ${res.data.data.sent}, Failed: ${res.data.data.failed}`);
    } finally {
      setSending(false);
    }
  };

  const cardsReady = guests.filter((g) => g.invitations?.[0]?.cardUrl);

  return (
    <>
      {/* ── Merge Preview Modal ── */}
      {showPreview && template && guests.length > 0 && (
        <MergePreviewModal
          template={template}
          guests={guests}
          onClose={() => setShowPreview(false)}
          onGenerateAll={generateCards}
          generating={generating}
        />
      )}

      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/events/${eventId}`} className="text-slate-400 hover:text-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="page-title flex-1">Invitations</h1>
          {guests.length > 0 && template && (
            <button onClick={() => setShowPreview(true)} className="btn-secondary text-sm hidden sm:flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-entron-blue" /> Preview
            </button>
          )}
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
              Upload Card Template
            </h2>
            {template && step !== "template" && (
              <button onClick={() => openEditor(template)} className="btn-secondary text-xs">
                <Move className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          {!template && !previewUrl && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-entron-dark-border rounded-xl py-10 cursor-pointer hover:border-entron-blue/50 transition-colors">
              <ImageIcon className="w-10 h-10 text-slate-500 mb-3" />
              <p className="text-slate-300 font-medium">Click to upload a template image</p>
              <p className="text-slate-500 text-sm mt-1">PNG or JPG — your card design</p>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setPendingFile(f); setPreviewUrl(URL.createObjectURL(f)); }} />
            </label>
          )}

          {previewUrl && step === "template" && (
            <div className="space-y-4">
              <TemplateDesigner imageUrl={previewUrl} fields={fields} onChange={setFields} />
              <div className="flex gap-3">
                <button onClick={saveTemplate} disabled={savingTemplate} className="btn-primary flex-1">
                  <Check className="w-4 h-4" />
                  {savingTemplate ? "Saving..." : "Save & Continue"}
                </button>
                {template && (
                  <button onClick={() => { setPreviewUrl(null); setPendingFile(null); setStep("excel"); }} className="btn-secondary">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {template && step !== "template" && (
            <div className="flex items-center gap-3">
              <img src={template.fileUrl} alt="template" className="w-20 h-auto rounded-lg border border-entron-dark-border object-cover" />
              <div className="text-sm space-y-1">
                <p className="text-slate-200 font-medium">{template.name}</p>
                <p className="text-xs text-slate-500">
                  Name: x={template.fields?.guestName?.x}, y={template.fields?.guestName?.y} · QR: x={template.fields?.qrCode?.x}, y={template.fields?.qrCode?.y}
                </p>
                <span className="badge badge-green text-xs flex items-center gap-1 w-fit">
                  <Check className="w-3 h-3" /> Saved
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
              Upload Guest Excel File
            </h2>

            <div className="bg-slate-800/60 rounded-lg p-3 text-xs text-slate-400 space-y-1">
              <p className="font-medium text-slate-300 mb-2">Required Excel columns:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  ["firstName",  "First name (required)"],
                  ["lastName",   "Last name (required)"],
                  ["phone",      "Phone number"],
                  ["guestType",  "SINGLE / DOUBLE / FAMILY / VIP"],
                  ["tableNumber","Table number"],
                  ["seatNumber", "Seat number"],
                  ["email",      "Email address"],
                  ["notes",      "Notes"],
                ].map(([col, desc]) => (
                  <div key={col} className="flex gap-1.5">
                    <span className="font-mono text-entron-blue">{col}</span>
                    <span className="text-slate-500">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {importResult && (
              <div className="bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-3 text-sm flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-green-300">
                  <strong>{importResult.imported}</strong> guests imported.
                  {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
                </span>
              </div>
            )}

            {/* Upload drop zone */}
            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors ${importing ? "border-entron-blue/50 bg-entron-blue/5 cursor-default" : "border-entron-dark-border hover:border-entron-blue/50"}`}>
              {importing ? (
                <>
                  <Loader2 className="w-8 h-8 text-entron-blue animate-spin mb-2" />
                  <p className="text-slate-300 text-sm">Importing guests...</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-10 h-10 text-slate-500 mb-3" />
                  <p className="text-slate-300 font-medium">Click to upload Excel</p>
                  <p className="text-slate-500 text-sm mt-1">.xlsx or .xls</p>
                  {guests.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">{guests.length} guests loaded — uploading adds more</p>
                  )}
                </>
              )}
              <input type="file" accept=".xlsx,.xls" className="hidden" disabled={importing}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importExcel(f); }} />
            </label>

            {/* Preview + Generate buttons — shown when guests exist */}
            {guests.length > 0 && !importing && (
              <div className="flex flex-wrap gap-3 pt-1">
                {/* Preview button */}
                <button
                  onClick={() => setShowPreview(true)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-entron-blue" />
                  Preview Merge ({guests.length} guests)
                </button>

                {/* Direct regenerate (for when cards already exist) */}
                <button onClick={generateCards} disabled={generating} className="btn-secondary text-sm">
                  {generating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    : <><RefreshCw className="w-4 h-4" /> {cardsReady.length > 0 ? "Regenerate" : "Generate"} Cards</>
                  }
                </button>

                {genResult && (
                  <span className="text-xs text-slate-400 self-center">
                    {genResult.generated} generated · {genResult.failed} failed
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
                Cards Ready ({cardsReady.length}/{guests.length})
              </h2>
              <a href={`/api/v1/events/${eventId}/invitations/download-zip`} className="btn-secondary text-xs">
                <Download className="w-3.5 h-3.5" /> Download All
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cardsReady.map((g) => {
                const inv    = g.invitations![0];
                const cardUrl = inv.cardUrl as string;
                const status  = inv.status  as string;
                return (
                  <div key={g.id} className="group relative rounded-xl overflow-hidden border border-entron-dark-border bg-slate-800">
                    <img src={cardUrl} alt={`${g.firstName} ${g.lastName}`} className="w-full aspect-[3/4] object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <a href={cardUrl} download={`${g.firstName}-${g.lastName}.jpg`}
                        className="btn-primary text-xs w-full justify-center">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-xs text-slate-200 font-medium truncate">{g.firstName} {g.lastName}</p>
                      <div className="flex gap-1 flex-wrap">
                        <span className={`badge text-xs ${TYPE_COLOR[g.guestType] ?? "badge-blue"}`}>{TYPE_LABEL[g.guestType] ?? g.guestType}</span>
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
              <Send className="w-4 h-4 text-entron-blue" /> Send via WhatsApp
            </h2>
            <div className="input-group">
              <label>Message (use {"{{name}}"} for guest name)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="text-sm" />
            </div>
            <button onClick={sendBulk} disabled={sending} className="btn-primary w-full">
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : `Send to All Guests (${cardsReady.length})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
