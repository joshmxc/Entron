"use client";
import { use, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";

export default function ImportPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: Array<{ row: number; message: string }> } | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/events/${eventId}/guests/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.data);
    } catch {
      alert("Failed to import file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/events/${eventId}/guests`} className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title">Import Guests from Excel</h1>
      </div>

      {/* Template info */}
      <div className="card mb-4 text-sm text-slate-300 space-y-1">
        <p className="font-medium text-slate-200 mb-2">Excel column format (row 1 = header):</p>
        <code className="text-xs text-entron-blue block overflow-x-auto whitespace-nowrap">
          firstName | lastName | phone | email | guestType | maxAdmissions | tableNumber | seatNumber | notes
        </code>
        <p className="text-xs text-slate-500 mt-1">guestType: SINGLE, DOUBLE, FAMILY, or VIP</p>
      </div>

      {!result ? (
        <>
          <div
            {...getRootProps()}
            className={`card border-2 border-dashed cursor-pointer text-center py-12 transition-all ${
              isDragActive ? "border-entron-blue bg-entron-blue/10" : "border-entron-dark-border hover:border-entron-blue/50"
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            {file ? (
              <p className="text-slate-200 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-slate-300">Drag file here or click to select</p>
                <p className="text-slate-500 text-sm mt-1">.xlsx, .xls, .csv</p>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Link href={`/events/${eventId}/guests`} className="btn-secondary flex-1 text-center">Cancel</Link>
            <button onClick={handleImport} disabled={!file || loading} className="btn-primary flex-1">
              <Upload className="w-4 h-4" />
              {loading ? "Importing..." : "Import Guests"}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="card border-green-700/50">
            <CheckCircle className="w-8 h-8 text-blue-400 mb-3" />
            <p className="text-xl font-bold text-blue-400">{result.imported} imported</p>
            {result.skipped > 0 && <p className="text-slate-400 text-sm">{result.skipped} skipped</p>}
          </div>

          {result.errors.length > 0 && (
            <div className="card border-red-700/50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="font-medium text-slate-200">Errors ({result.errors.length})</p>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400">Row {e.row}: {e.message}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setFile(null); setResult(null); }} className="btn-secondary flex-1">
              Import More
            </button>
            <Link href={`/events/${eventId}/guests`} className="btn-primary flex-1 text-center">
              View Guests
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
