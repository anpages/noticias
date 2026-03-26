"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "system", setTheme: () => {} });

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial = stored === "light" || stored === "dark" ? stored : "system";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") applyTheme("system"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext value={value}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
