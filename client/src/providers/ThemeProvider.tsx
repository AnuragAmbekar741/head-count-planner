/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  forcedTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

export const ThemeProviderContext =
  createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  forcedTheme,
  ...props
}: ThemeProviderProps) {
  // If forcedTheme is provided, always use it; otherwise use localStorage or defaultTheme
  const [theme, setTheme] = useState<Theme>(() => {
    if (forcedTheme) {
      return forcedTheme;
    }
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    // If forcedTheme is provided, always use it
    const activeTheme = forcedTheme || theme;

    if (activeTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(activeTheme);
  }, [theme, forcedTheme]);

  const value = {
    theme: forcedTheme || theme, // Always return forcedTheme if provided
    setTheme: (newTheme: Theme) => {
      // If forcedTheme is set, don't allow changing theme
      if (forcedTheme) {
        return;
      }
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
