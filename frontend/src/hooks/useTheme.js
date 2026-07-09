"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "almanac-theme";
const THEME_COLORS = {
  dark: "#0b0f14",
  light: "#dfe5eb",
};

function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.dataset.theme = theme;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", THEME_COLORS[theme]);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("light")
      ? "light"
      : "dark";

    setTheme(activeTheme);
  }, []);

  function toggleTheme() {
    const activeTheme =
      theme ||
      (document.documentElement.classList.contains("light") ? "light" : "dark");
    const nextTheme = activeTheme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return { theme, toggleTheme };
}
