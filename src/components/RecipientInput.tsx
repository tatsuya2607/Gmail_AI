"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";

interface Props {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  rightSlot?: React.ReactNode;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitInput(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function RecipientInput({ label, values, onChange, placeholder, rightSlot }: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commitDraft(): boolean {
    const parts = splitInput(draft);
    if (parts.length === 0) {
      setDraft("");
      return false;
    }
    const merged = [...values];
    for (const p of parts) {
      if (!merged.includes(p)) merged.push(p);
    }
    onChange(merged);
    setDraft("");
    return true;
  }

  function removeAt(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim().length > 0) {
        e.preventDefault();
        commitDraft();
      }
    } else if (e.key === "Backspace" && draft.length === 0 && values.length > 0) {
      e.preventDefault();
      removeAt(values.length - 1);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (/[,;\s]/.test(text)) {
      e.preventDefault();
      const parts = splitInput(text);
      if (parts.length > 0) {
        const merged = [...values];
        for (const p of parts) {
          if (!merged.includes(p)) merged.push(p);
        }
        onChange(merged);
        setDraft("");
      }
    }
  }

  return (
    <div className="field recip-field">
      <label>
        <span>{label}</span>
        {rightSlot}
      </label>
      <div className="recip-box" onClick={() => inputRef.current?.focus()}>
        {values.map((v, i) => {
          const valid = EMAIL_RE.test(v);
          return (
            <span key={`${v}-${i}`} className={"recip-chip" + (valid ? "" : " invalid")}>
              <span className="recip-chip-text">{v}</span>
              <button
                type="button"
                className="recip-chip-x"
                aria-label="remove"
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
              >
                ✕
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          className="recip-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : ""}
        />
      </div>
    </div>
  );
}
