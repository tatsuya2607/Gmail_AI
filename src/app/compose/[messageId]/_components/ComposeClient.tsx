"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GmailMessageDetail } from "@/lib/google";

interface Template {
  id: number;
  name: string;
  prompt: string;
}

interface Account {
  id: string;
  email: string;
  name: string | null;
}

type Phase = "idle" | "thinking" | "streaming" | "editable";

interface Props {
  message: GmailMessageDetail;
  templates: Template[];
  accountId: string;
  accounts: Account[];
}

function Icon({ name, size = 14 }: { name: string; size?: number }) {
  let content: React.ReactNode = null;

  if (name === "send")
    content = <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
  else if (name === "sparkle")
    content = <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" fill="currentColor" />;
  else if (name === "refresh")
    content = <><path d="M1 4v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M23 20v-6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "draft")
    content = <><path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "chev")
    content = <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
  else if (name === "check")
    content = <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
  else if (name === "search")
    content = <><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>;
  else if (name === "settings")
    content = <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" /></>;
  else if (name === "template")
    content = <><rect x="3" y="3" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="9" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="14" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.8" /></>;
  else if (name === "check-circle")
    content = <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "inbox")
    content = <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "home")
    content = <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {content}
    </svg>
  );
}

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height) * 1.5;
  ripple.className = "ripple";
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("ja-JP", {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseSenderName(from: string): string {
  const m = from.match(/^"?([^"<]+)"?\s*</);
  return m ? m[1].trim() : from;
}

export function ComposeClient({ message, templates, accountId, accounts }: Props) {
  const router = useRouter();

  const [userPrompt, setUserPrompt] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [model, setModel] = useState<"haiku" | "sonnet">("haiku");
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayedReply, setDisplayedReply] = useState("");
  const [isEdited, setIsEdited] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);
  const [showAcctDropdown, setShowAcctDropdown] = useState(false);
  const [showTmplDropdown, setShowTmplDropdown] = useState(false);
  const [subjectLine, setSubjectLine] = useState(() => {
    const s = message.subject || "";
    return s.startsWith("Re:") ? s : `Re: ${s}`;
  });

  const acctBtnRef = useRef<HTMLButtonElement>(null);
  const tmplBtnRef = useRef<HTMLButtonElement>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentAccount = accounts.find((a) => a.id === accountId);
  const selectedTemplate = templates.find((t) => t.id === templateId);

  const toHeader = (() => {
    const m = message.from.match(/<([^>]+)>/);
    return m ? m[1] : message.from;
  })();

  useEffect(() => {
    return () => { if (streamTimerRef.current) clearInterval(streamTimerRef.current); };
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (acctBtnRef.current && !acctBtnRef.current.closest(".acct-scope")?.contains(e.target as Node)) {
        setShowAcctDropdown(false);
      }
      if (tmplBtnRef.current && !tmplBtnRef.current.closest(".tmpl-scope")?.contains(e.target as Node)) {
        setShowTmplDropdown(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const startStreaming = useCallback((text: string) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setPhase("streaming");
    setDisplayedReply("");
    let i = 0;
    const chunkSize = Math.max(1, Math.ceil(text.length / 100));
    streamTimerRef.current = setInterval(() => {
      i += chunkSize;
      if (i >= text.length) {
        clearInterval(streamTimerRef.current!);
        setDisplayedReply(text);
        setPhase("editable");
      } else {
        setDisplayedReply(text.slice(0, i));
      }
    }, 18);
  }, []);

  async function handleGenerate(e?: React.MouseEvent<HTMLButtonElement>) {
    if (e) addRipple(e);
    if (!userPrompt.trim() || phase === "thinking" || phase === "streaming") return;
    setPhase("thinking");
    setGenerateError(null);
    setIsEdited(false);
    setDisplayedReply("");

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          accountId,
          userPrompt,
          templateId: templateId ?? undefined,
          model,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      startStreaming(data.reply);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "生成に失敗しました");
      setPhase("idle");
    }
  }

  async function handleSend() {
    if (!displayedReply.trim()) return;
    setSendError(null);
    const refs = [message.references, message.messageId].filter(Boolean).join(" ").trim();

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: toHeader,
          subject: message.subject,
          replyBody: displayedReply,
          inReplyTo: message.messageId || undefined,
          references: refs || undefined,
          threadId: message.threadId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToastVisible(true);
      setTimeout(() => {
        setToastExiting(true);
        setTimeout(() => {
          setToastVisible(false);
          setToastExiting(false);
          router.push(`/account/${encodeURIComponent(accountId)}`);
        }, 220);
      }, 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "送信に失敗しました");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  }

  const canGenerate = userPrompt.trim().length > 0 && phase !== "thinking" && phase !== "streaming";
  const canSend = (phase === "editable" || phase === "streaming") && displayedReply.trim().length > 0;

  return (
    <div className="compose-page">

      {/* ── Titlebar ── */}
      <div className="titlebar">
        <div className="dots">
          <i style={{ background: "#ff5f57" }} />
          <i style={{ background: "#ffbd2e" }} />
          <i style={{ background: "#28c840" }} />
        </div>
        <div className="brand">
          <span className="brand-mark">G</span>
          Gmail AI
        </div>
        <div className="path">
          <span>inbox</span>
          <span className="sep">/</span>
          <span>{message.id.slice(0, 10)}</span>
          <span className="sep">/</span>
          <span>reply</span>
        </div>
        <div className="tb-right">
          <span><span className="kbd">⌘K</span> コマンド</span>
          <span><span className="kbd">?</span> ヘルプ</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <nav className="crumbs">
          <a href="/" className="seg"><Icon name="home" size={13} /></a>
          <a href={`/account/${encodeURIComponent(accountId)}`} className="seg">
            <Icon name="inbox" size={13} />受信トレイ
          </a>
          <span className="seg active">
            <Icon name="draft" size={13} />返信作成
          </span>
        </nav>

        {/* Account switcher */}
        <div className="acct-scope" style={{ position: "relative" }}>
          <button
            ref={acctBtnRef}
            className="acct"
            onClick={() => setShowAcctDropdown((v) => !v)}
          >
            <span className="avatar">
              {(currentAccount?.email ?? accountId).charAt(0).toUpperCase()}
            </span>
            <span className="acct-mail">{currentAccount?.email ?? accountId}</span>
            <span className="caret"><Icon name="chev" size={12} /></span>
          </button>
          {showAcctDropdown && (
            <div className="dropdown" style={{ top: "calc(100% + 4px)", left: 0, position: "absolute" }}>
              <div className="dd-grp">アカウント</div>
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="dd-opt"
                  onClick={() => {
                    setShowAcctDropdown(false);
                    if (a.id !== accountId) router.push(`/account/${encodeURIComponent(a.id)}`);
                  }}
                >
                  <span className="avatar">{a.email.charAt(0).toUpperCase()}</span>
                  <div className="dd-info">
                    <span className="dd-name">{a.name ?? a.email}</span>
                    <span className="dd-mail">{a.email}</span>
                  </div>
                  {a.id === accountId && <span className="dd-check"><Icon name="check" size={14} /></span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tools-right">
          <a href="/templates" className="icon-btn" title="テンプレート">
            <Icon name="template" size={14} />
          </a>
          <button className="icon-btn" title="設定">
            <Icon name="settings" size={14} />
          </button>
        </div>
      </div>

      {/* ── Main split ── */}
      <div className="main">

        {/* Left: Source email */}
        <div className="pane">
          <div className="pane-head">
            <span className="label"><b>元メール</b></span>
            <div className="ph-right">
              <span className="tag">INBOX</span>
            </div>
          </div>
          <div className="src">
            <dl className="src-meta">
              <dt className="k">from</dt>
              <dd className="v">
                <div className="from">
                  <span className="name">{parseSenderName(message.from)}</span>
                </div>
              </dd>
              <dt className="k">addr</dt>
              <dd className="v mono">{toHeader}</dd>
              <dt className="k">to</dt>
              <dd className="v mono">{currentAccount?.email ?? accountId}</dd>
              <dt className="k">date</dt>
              <dd className="v mono">{formatDate(message.date)}</dd>
            </dl>
            <div className="src-subject">{message.subject || "(件名なし)"}</div>
            <pre className="src-body">{message.body || message.snippet || "(本文なし)"}</pre>
            <div className="src-foot">
              <span className="chip"><span className="swatch" />text/plain</span>
              {message.messageId && (
                <span className="chip">{message.messageId.slice(0, 22)}…</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI generation */}
        <div className="pane">
          <div className="pane-head">
            <span className="label"><b>AI 返信生成</b></span>
            <div className="ph-right">
              <span className="tag">{model}</span>
            </div>
          </div>
          <div className="gen">

            {/* Instruction section */}
            <div className="section">
              <div className="title-row">
                <h3>指示</h3>
                <span className="hint"><span className="kbd">⌘↩</span> で生成</span>
              </div>
              <div className="instr-wrap">
                <textarea
                  className="instr"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="例: 丁寧にお断りする。来週なら都合がよいと伝える。"
                  rows={3}
                />
                <div className="instr-foot">
                  <span className="kbd">⌘↩</span>
                  <span style={{ color: "var(--fg-faint)" }}>で生成</span>
                  <span className="count">{userPrompt.length} chars</span>
                </div>
              </div>
              {generateError && <div className="gen-error">{generateError}</div>}
            </div>

            {/* Controls section */}
            <div className="section">
              <div className="ctrl-row">

                {/* Template selector */}
                <div className="field tmpl-scope" style={{ position: "relative" }}>
                  <label>テンプレート</label>
                  <button
                    ref={tmplBtnRef}
                    className="select"
                    style={{ width: "100%" }}
                    onClick={() => setShowTmplDropdown((v) => !v)}
                  >
                    <span className="v">{selectedTemplate?.name ?? "なし"}</span>
                    <span className="caret"><Icon name="chev" size={12} /></span>
                  </button>
                  {showTmplDropdown && (
                    <div className="dropdown" style={{ top: "calc(100% + 4px)", left: 0, position: "absolute" }}>
                      <div
                        className="dd-opt"
                        onClick={() => { setTemplateId(null); setShowTmplDropdown(false); }}
                      >
                        {templateId === null && <span className="dd-check"><Icon name="check" size={14} /></span>}
                        <span>なし</span>
                      </div>
                      {templates.length > 0 && <div className="dd-sep" />}
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          className="dd-opt"
                          onClick={() => { setTemplateId(t.id); setShowTmplDropdown(false); }}
                        >
                          {t.id === templateId && <span className="dd-check"><Icon name="check" size={14} /></span>}
                          <div className="dd-info">
                            <span className="dd-name">{t.name}</span>
                            <span className="dd-mail">{t.prompt.slice(0, 45)}{t.prompt.length > 45 ? "…" : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model toggle */}
                <div className="field">
                  <label>モデル</label>
                  <div className="model-toggle">
                    <button className={model === "haiku" ? "on" : ""} onClick={() => setModel("haiku")}>
                      <span className="ico haiku" />haiku
                    </button>
                    <button className={model === "sonnet" ? "on" : ""} onClick={() => setModel("sonnet")}>
                      <span className="ico sonnet" />sonnet
                    </button>
                  </div>
                </div>

                {/* Generate button */}
                <div className="field">
                  <label>&nbsp;</label>
                  <button
                    className="btn primary"
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                  >
                    {phase === "thinking" ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "cp-spin 1s linear infinite" }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        生成中…
                      </>
                    ) : (
                      <>
                        <Icon name="sparkle" size={13} />
                        生成
                        <span className="kbd-inline">⌘↩</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Output area */}
            <div className="out">
              <div className="out-head">
                <h3>返信</h3>
                <div className="meta">
                  {phase === "editable" && isEdited && (
                    <span className="body-edited-pill"><Icon name="draft" size={10} />編集済み</span>
                  )}
                  {phase === "streaming" && (
                    <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "10.5px" }}>
                      生成中…
                    </span>
                  )}
                </div>
              </div>

              <div className="subject-row">
                <span className="subject-prefix">件名:</span>
                <input
                  className="subject-input"
                  type="text"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                />
              </div>

              {phase === "thinking" && (
                <div className="skeleton">
                  <div className="sk-line" style={{ width: "88%" }} />
                  <div className="sk-line" style={{ width: "100%" }} />
                  <div className="sk-line" style={{ width: "75%" }} />
                  <div className="sk-line" style={{ width: "93%" }} />
                  <div className="sk-line" style={{ width: "62%" }} />
                  <div className="sk-line" style={{ width: "80%" }} />
                </div>
              )}

              {(phase === "streaming" || phase === "editable") && (
                <textarea
                  className="body-edit"
                  value={displayedReply}
                  onChange={(e) => {
                    setDisplayedReply(e.target.value);
                    setIsEdited(true);
                  }}
                  readOnly={phase === "streaming"}
                  placeholder="生成された返信がここに表示されます"
                />
              )}

              {phase === "idle" && (
                <textarea
                  className="body-edit"
                  value=""
                  readOnly
                  placeholder="指示を入力して生成ボタンを押してください"
                />
              )}

              {sendError && <div className="gen-error">{sendError}</div>}
            </div>

            {/* Actions bar */}
            <div className="actions">
              <button
                className="btn ghost"
                disabled={!canGenerate}
                onClick={handleGenerate}
              >
                <Icon name="refresh" size={13} />
                再生成
              </button>
              <div className="spacer" />
              <div className="meta-mini">
                <span>To: <b>{toHeader}</b></span>
              </div>
              <button
                className="btn primary"
                disabled={!canSend}
                onClick={handleSend}
              >
                <Icon name="send" size={13} />
                送信
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="statusbar">
        <div className="sb-item">
          <span className="dot" />
          接続済み
        </div>
        <div className="sb-item">{currentAccount?.email ?? accountId}</div>
        <div className="sb-item">
          {model === "haiku" ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-6"}
        </div>
        <div className="sb-item sb-right">Gmail AI Reply</div>
      </div>

      {/* ── Toast ── */}
      {toastVisible && (
        <div className="toast-wrap">
          <div className={`toast${toastExiting ? " exit" : ""}`}>
            <span className="t-icon"><Icon name="check-circle" size={16} /></span>
            <div>
              <div className="t-title">送信しました</div>
              <div className="t-sub">受信トレイに戻ります…</div>
            </div>
            <div className="t-bar" />
          </div>
        </div>
      )}
    </div>
  );
}
