"use client";
import { useRef, useCallback, useState } from "react";
import jsQR from "jsqr";
import api from "@/lib/api";
import { queueOfflineScan } from "@/lib/indexeddb";
import { useScanStore, ScanResult } from "@/store/scanStore";

type ScannerState = "IDLE" | "SCANNING" | "PENDING" | "RESULT" | "COOLDOWN";

const COOLDOWN_MS = 1500;

function getDeviceId(): string {
  const existing = localStorage.getItem("entron-device-id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("entron-device-id", id);
  return id;
}

export function useScanner(eventId: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<ScannerState>("IDLE");
  const deviceIdRef = useRef<string | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>("IDLE");
  const [result, setResult] = useState<ScanResult | null>(null);
  const { setResult: storeResult } = useScanStore();

  const playSound = (type: "success" | "error") => {
    try {
      new Audio(`/sounds/${type}.mp3`).play().catch(() => {});
    } catch {}
  };

  const setState = (s: ScannerState) => {
    stateRef.current = s;
    setScannerState(s);
  };

  const showResult = useCallback((scanResult: ScanResult) => {
    setResult(scanResult);
    storeResult(scanResult);
    setState("RESULT");
    playSound(scanResult.status === "SUCCESS" ? "success" : "error");
  }, [storeResult]);

  const handleScan = useCallback(async (qrCode: string) => {
    try {
      const res = await api.post("/scans", { qrCode, eventId });
      showResult(res.data.data as ScanResult);
    } catch (err: unknown) {
      const isNetworkError =
        (err as { code?: string }).code === "ERR_NETWORK" ||
        (err as { message?: string }).message === "Network Error";

      if (isNetworkError) {
        if (!deviceIdRef.current) deviceIdRef.current = getDeviceId();
        await queueOfflineScan({
          qrCode,
          eventId,
          timestamp: new Date().toISOString(),
          deviceId: deviceIdRef.current,
        });
        showResult({ status: "SUCCESS", message: "Imehifadhiwa — itatumiwa baadaye" });
      } else {
        showResult({ status: "INVALID_QR", message: "Skani imeshindwa" });
      }
    }
  }, [eventId, showResult]);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    setState("SCANNING");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      console.error("Camera error:", err);
      setState("IDLE");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      if (stateRef.current !== "SCANNING") return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const { videoWidth: w, videoHeight: h } = video;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = w;
      canvas.height = h;
      ctx?.drawImage(video, 0, 0, w, h);

      const imageData = ctx?.getImageData(0, 0, w, h);
      if (imageData) {
        const code = jsQR(imageData.data, w, h, {
          inversionAttempts: "dontInvert",
        });

        if (code?.data) {
          setState("PENDING");
          handleScan(code.data).then(() => {
            setTimeout(() => {
              setState("COOLDOWN");
              setTimeout(() => {
                setResult(null);
                startScanning();
              }, 300);
            }, COOLDOWN_MS);
          });
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [eventId, handleScan]);

  const stopScanning = useCallback(() => {
    setState("IDLE");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  return { videoRef, scannerState, result, startScanning, stopScanning };
}
