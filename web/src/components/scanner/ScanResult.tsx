"use client";
import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, User, Hash } from "lucide-react";
import { ScanResult as ScanResultType } from "@/store/scanStore";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  SINGLE: "Mmoja", DOUBLE: "Wawili", FAMILY: "Familia", VIP: "VIP",
};

const STATUS_CONFIG: Record<string, { bg: string; icon: React.ElementType; label: string; iconColor: string }> = {
  SUCCESS: { bg: "bg-green-600", icon: CheckCircle, label: "KARIBU!", iconColor: "text-white" },
  ALREADY_SCANNED: { bg: "bg-red-600", icon: XCircle, label: "IMESKANWA TAYARI", iconColor: "text-white" },
  LIMIT_REACHED: { bg: "bg-orange-600", icon: AlertTriangle, label: "KIKOMO KIMEFIKIWA", iconColor: "text-white" },
  INVALID_QR: { bg: "bg-red-700", icon: XCircle, label: "QR BATILI", iconColor: "text-white" },
  WRONG_EVENT: { bg: "bg-red-700", icon: XCircle, label: "TUKIO TOFAUTI", iconColor: "text-white" },
};

interface Props {
  result: ScanResultType;
  onDismiss?: () => void;
}

export default function ScanResult({ result, onDismiss }: Props) {
  const config = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.INVALID_QR;
  const Icon = config.icon;
  const isSuccess = result.status === "SUCCESS";

  useEffect(() => {
    const src = isSuccess ? "/sounds/success.mp3" : "/sounds/error.mp3";
    const audio = new Audio(src);
    audio.play().catch(() => {});
  }, [isSuccess]);

  return (
    <div
      className={cn("scan-overlay fixed inset-0 z-50 flex flex-col items-center justify-center px-6", config.bg)}
      onClick={onDismiss}
    >
      <Icon className={cn("w-24 h-24 mb-6", config.iconColor)} strokeWidth={1.5} />

      <h1 className="text-4xl font-black text-white mb-2 text-center tracking-wide">
        {config.label}
      </h1>

      {result.guest && (
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <User className="w-5 h-5 text-white/70" />
            <p className="text-2xl font-bold text-white">
              {result.guest.firstName} {result.guest.lastName}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full">
              {TYPE_LABELS[result.guest.guestType] ?? result.guest.guestType}
            </span>
            {result.guest.tableNumber && (
              <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Meza {result.guest.tableNumber}
              </span>
            )}
          </div>

          {isSuccess && (
            <p className="text-white/80 mt-2 text-lg">
              Kuingia {result.guest.admissionsUsed}/{result.guest.maxAdmissions}
            </p>
          )}
        </div>
      )}

      {!result.guest && !isSuccess && (
        <p className="text-white/70 text-lg mt-4 text-center">{result.message}</p>
      )}

      <p className="absolute bottom-12 text-white/50 text-sm">Gusa kuendelea</p>
    </div>
  );
}
