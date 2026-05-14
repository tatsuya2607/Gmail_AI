"use client";

interface Props {
  theme: "system" | "light" | "dark";
  onThemeChange: (t: "system" | "light" | "dark") => void;
  onClose: () => void;
}

export function SettingsModal({ theme, onThemeChange, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>設定</span>
          <button
            className="icon-btn"
            onClick={onClose}
            style={{ fontSize: 16, color: "var(--fg-mute)" }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <div className="settings-label">テーマ</div>
            <div className="theme-toggle">
              <button className={theme === "system" ? "on" : ""} onClick={() => onThemeChange("system")}>システム</button>
              <button className={theme === "light" ? "on" : ""} onClick={() => onThemeChange("light")}>ライト</button>
              <button className={theme === "dark" ? "on" : ""} onClick={() => onThemeChange("dark")}>ダーク</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
