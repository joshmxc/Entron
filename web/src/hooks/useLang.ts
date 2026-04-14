"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Lang = "sw" | "en";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000`;
}

export function useLang() {
  const [lang, setLang] = useState<Lang>("en");
  const router = useRouter();

  useEffect(() => {
    const saved = getCookie("NEXT_LOCALE") as Lang | null;
    if (saved === "en" || saved === "sw") setLang(saved);
  }, []);

  const toggle = useCallback(() => {
    const next: Lang = lang === "sw" ? "en" : "sw";
    setCookie("NEXT_LOCALE", next);
    setLang(next);
    router.refresh();
  }, [lang, router]);

  return { lang, toggle };
}
