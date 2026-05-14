"use client";

import { useState } from "react";

interface Props {
  accountId: string;
  onClose: () => void;
}

export function ComposeModal({ accountId, onClose }: Props) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, to: to.trim(), subject: subject.trim(), replyBody: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSentOk(true);
      setTimeout(() => { onClose(); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>新規メール作成</span>
          <button className="icon-btn" style={{ fontSize: 16, color: "var(--fg-mute)" }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>To</label>
            <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
          </div>
          <div className="field">
            <label>件名</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="件名を入力..." />
          </div>
          <div className="field">
            <label>本文</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="メール本文を入力..." rows={8} />
          </div>
          {error && <div className="modal-error">{error}</div>}
          {sentOk && <div className="modal-success">送信しました</div>}
        </div>
        <div className="modal-foot">
          <button className="modal-btn-ghost" onClick={onClose}>キャンセル</button>
          <button
            className="modal-btn-primary"
            disabled={!to.trim() || !subject.trim() || !body.trim() || sending}
            onClick={handleSend}
          >
            {sending ? "送信中…" : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
}
