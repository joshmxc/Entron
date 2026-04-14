"use client";
import { useEffect, useRef } from "react";
import { queueOfflineScan, getOfflineScans, deleteOfflineScan } from "@/lib/indexeddb";
import api from "@/lib/api";

export function useOfflineQueue() {
  const syncing = useRef(false);

  const sync = async () => {
    if (syncing.current) return;
    syncing.current = true;

    try {
      const scans = await getOfflineScans();
      if (scans.length === 0) return;

      const items = scans.map(({ key: _key, ...data }) => ({
        qrCode: data.qrCode,
        eventId: data.eventId,
        offlineTimestamp: data.timestamp,
      }));

      await api.post("/scans/batch-sync", { items });

      for (const scan of scans) {
        await deleteOfflineScan(scan.key);
      }

      console.log(`[offline] Synced ${scans.length} scans`);
    } catch (err) {
      console.warn("[offline] Sync failed:", err);
    } finally {
      syncing.current = false;
    }
  };

  useEffect(() => {
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);

  return { queue: queueOfflineScan, sync };
}
