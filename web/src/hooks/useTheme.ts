"use client";
import { useState, useEffect, useCallback, createContext, useContext } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeProvider(): ThemeContextValue {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("entron-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = stored ?? preferred;
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("entron-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, isDark: theme === "dark", toggle };
}
