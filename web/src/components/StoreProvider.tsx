"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    // Give rehydration one tick to complete
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="w-16 h-16 bg-[#1e3a8a] rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-3xl leading-none">E</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
