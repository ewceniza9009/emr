import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("halkyone-theme") as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Fallback to system preferences
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    } catch (e) {
      console.warn("LocalStorage error in ThemeContext:", e);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark", "ion-palette-dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark", "ion-palette-dark");
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("halkyone-theme", next);
      } catch (e) {
        console.warn("LocalStorage write error:", e);
      }
      return next;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
