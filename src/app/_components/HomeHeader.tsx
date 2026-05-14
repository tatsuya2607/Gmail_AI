"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function HomeHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null;
      setTheme(saved ?? "system");
    } catch {}
  }, []);

  function applyTheme(t: "system" | "light" | "dark") {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("theme");
        document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        localStorage.setItem("theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  }

  return (
    <>
      <AppHeader
        pathSegments={[{ label: "dashboard", dim: true }]}
        right={
          <button className="icon-btn" title="設定" onClick={() => setSettingsOpen(true)}>
            <GearIcon />
          </button>
        }
      />
      {settingsOpen && (
        <div className="home-modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="home-modal" onClick={(e) => e.stopPropagation()}>
            <div className="home-modal-head">
              <span>設定</span>
              <button
                className="home-modal-close"
                onClick={() => setSettingsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="home-modal-body">
              <div className="home-settings-label">テーマ</div>
              <div className="home-theme-toggle">
                <button className={theme === "system" ? "on" : ""} onClick={() => applyTheme("system")}>システム</button>
                <button className={theme === "light" ? "on" : ""} onClick={() => applyTheme("light")}>ライト</button>
                <button className={theme === "dark" ? "on" : ""} onClick={() => applyTheme("dark")}>ダーク</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
