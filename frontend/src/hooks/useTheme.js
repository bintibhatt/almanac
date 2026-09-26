"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "almanac-theme";
const PALETTE_KEY = "almanac-palette";

export const PALETTES = [
  { id: "amber", name: "Warm Amber", color: "#f59e0b", bg: "#0f0f11" },
  { id: "sage", name: "Muted Sage", color: "#10b981", bg: "#0d100e" },
  { id: "violet", name: "Subtle Violet", color: "#8b5cf6", bg: "#0f0e15" },
  { id: "obsidian", name: "Stark Obsidian", color: "#ffffff", bg: "#09090b" },
];

function applyTheme(theme, palette = "violet") {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.palette = palette;
}

export function useTheme() {
  const [theme, setTheme] = useState("dark");
  const [palette, setPaletteState] = useState("violet");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) || "dark";
    const savedPalette = window.localStorage.getItem(PALETTE_KEY) || "violet";
    setTheme(savedTheme);
    setPaletteState(savedPalette);
    applyTheme(savedTheme, savedPalette);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme, palette);
  }

  function changePalette(newPalette) {
    setPaletteState(newPalette);
    window.localStorage.setItem(PALETTE_KEY, newPalette);
    applyTheme(theme, newPalette);
  }

  return { theme, toggleTheme, palette, changePalette, PALETTES };
}
