import { create } from "zustand";

export interface ScanResult {
  status: "SUCCESS" | "ALREADY_SCANNED" | "INVALID_QR" | "WRONG_EVENT" | "LIMIT_REACHED";
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    guestType: string;
    maxAdmissions: number;
    admissionsUsed: number;
    tableNumber?: string | null;
  };
  admissionCount?: number;
  message: string;
  timestamp?: string;
  staffName?: string;
}

interface ScanState {
  lastResult: ScanResult | null;
  recentScans: ScanResult[];
  totalToday: number;
  validToday: number;
  invalidToday: number;
  setResult: (result: ScanResult) => void;
  addLiveScan: (scan: ScanResult) => void;
  clearResult: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  lastResult: null,
  recentScans: [],
  totalToday: 0,
  validToday: 0,
  invalidToday: 0,
  setResult: (result) =>
    set((state) => ({
      lastResult: result,
      recentScans: [result, ...state.recentScans].slice(0, 50),
      totalToday: state.totalToday + 1,
      validToday: result.status === "SUCCESS" ? state.validToday + 1 : state.validToday,
      invalidToday: result.status !== "SUCCESS" ? state.invalidToday + 1 : state.invalidToday,
    })),
  addLiveScan: (scan) =>
    set((state) => ({
      recentScans: [scan, ...state.recentScans].slice(0, 50),
    })),
  clearResult: () => set({ lastResult: null }),
}));
