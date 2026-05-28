"use client";

import { useState } from "react";
import { RecipientInput } from "@/components/RecipientInput";

interface Props {
  accountId: string;
  onClose: () => void;
}

export function ComposeModal({ accountId, onClose }: Props) {
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = to.length > 0 && subject.trim() && body.trim() && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: to.join(", "),
          cc: cc.length > 0 ? cc.join(", ") : undefined,
          bcc: bcc.length > 0 ? bcc.join(", ") : undefined,
          subject: subject.trim(),
          replyBody: body.trim(),
        }),
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
      <div className="modal modal-compose" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>新規メール作成</span>
          <button className="icon-btn" style={{ fontSize: 16, color: "var(--fg-mute)" }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <RecipientInput
            label="To"
            values={to}
            onChange={setTo}
            placeholder="recipient@example.com"
            rightSlot={
              <span className="recip-toggle">
                {!showCc && (
                  <button type="button" onClick={() => setShowCc(true)}>Cc</button>
                )}
                {!showBcc && (
                  <button type="button" onClick={() => setShowBcc(true)}>Bcc</button>
                )}
              </span>
            }
          />
          {showCc && (
            <RecipientInput
              label="Cc"
              values={cc}
              onChange={setCc}
              placeholder="cc@example.com"
              rightSlot={
                <button
                  type="button"
                  className="recip-toggle"
                  onClick={() => { setShowCc(false); setCc([]); }}
                  style={{ background: "transparent", border: 0, color: "var(--fg-mute)", cursor: "pointer", fontSize: "10.5px", fontFamily: "var(--mono)" }}
                >
                  ✕ 削除
                </button>
              }
            />
          )}
          {showBcc && (
            <RecipientInput
              label="Bcc"
              values={bcc}
              onChange={setBcc}
              placeholder="bcc@example.com"
              rightSlot={
                <button
                  type="button"
                  className="recip-toggle"
                  onClick={() => { setShowBcc(false); setBcc([]); }}
                  style={{ background: "transparent", border: 0, color: "var(--fg-mute)", cursor: "pointer", fontSize: "10.5px", fontFamily: "var(--mono)" }}
                >
                  ✕ 削除
                </button>
              }
            />
          )}
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
            disabled={!canSend}
            onClick={handleSend}
          >
            {sending ? "送信中…" : "送信"}
          </button>
        </div>
      </div>
    </div>
  );
}
