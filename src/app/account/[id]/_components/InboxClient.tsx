"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GmailMessage } from "@/lib/google";

interface Account {
  id: string;
  email: string;
  name: string | null;
}

interface Props {
  messages: GmailMessage[];
  accounts: Account[];
  currentAccount: Account;
  accountId: string;
  fetchError: string | null;
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #6366f1, #4338ca)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #ef4444, #b91c1c)",
  "linear-gradient(135deg, #a78bfa, #7c3aed)",
  "linear-gradient(135deg, #06b6d4, #0e7490)",
  "linear-gradient(135deg, #ec4899, #be185d)",
  "linear-gradient(135deg, #84cc16, #4d7c0f)",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getGradient(seed: string): string {
  return AVATAR_GRADIENTS[hashStr(seed) % AVATAR_GRADIENTS.length];
}

function parseSender(from: string): { name: string; org: string } {
  const match = from.match(/^"?([^"<]+)"?\s*<([^>]*)>/);
  if (match) {
    const name = match[1].trim();
    const email = match[2];
    const domain = email.split("@")[1] ?? "";
    const org = domain.split(".")[0] ?? domain;
    return { name, org };
  }
  const atIdx = from.indexOf("@");
  if (atIdx !== -1) {
    const local = from.slice(0, atIdx);
    const domain = from.slice(atIdx + 1);
    const org = domain.split(".")[0];
    return { name: local, org };
  }
  return { name: from, org: "" };
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatWhen(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  if (isToday(dateStr)) {
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function Icon({
  name,
  size = 14,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const p: React.SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };
  switch (name) {
    case "home":
      return <svg {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
    case "inbox":
      return <svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
    case "sparkle":
      return <svg {...p}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m5.6 18.4 2.8-2.8"/><path d="m15.6 8.4 2.8-2.8"/></svg>;
    case "search":
      return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "settings":
      return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.27 16.96l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 7.2a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 19.73 7l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "template":
      return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
    case "chev":
      return <svg {...p}><path d="m6 9 6 6 6-6"/></svg>;
    case "plus":
      return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "refresh":
      return <svg {...p}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></svg>;
    case "check":
      return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    default:
      return null;
  }
}

function EmailRow({
  msg,
  accountId,
}: {
  msg: GmailMessage;
  accountId: string;
}) {
  const { name, org } = parseSender(msg.from);
  const initials = getInitials(name || msg.from);
  const grad = getGradient(msg.from);
  const href = `/compose/${msg.id}?accountId=${encodeURIComponent(accountId)}`;

  return (
    <Link href={href} className={"row" + (msg.isUnread ? " unread" : "")}>
      <span className="accent" />
      <span className="checkbox" onClick={(ev) => ev.preventDefault()} />
      <span
        className="avatar"
        style={{ background: grad, width: 22, height: 22, fontSize: "10.5px" }}
      >
        {initials}
      </span>
      <span className="from-block">
        <span className="from">{name || msg.from}</span>
        <span className="org">{org}</span>
      </span>
      <span className="subj-block">
        <span className="subj">{msg.subject || "(件名なし)"}</span>
        <span className="snippet">{msg.snippet}</span>
      </span>
      <span className="tags" />
      <span className="when">{formatWhen(msg.date)}</span>
    </Link>
  );
}

export function InboxClient({
  messages,
  accounts,
  currentAccount,
  accountId,
  fetchError,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctRect, setAcctRect] = useState<DOMRect | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const unreadCount = messages.filter((m) => m.isUnread).length;

  const filtered = messages.filter((m) => {
    if (filter === "unread" && !m.isUnread) return false;
    if (query) {
      const hay = (m.from + m.subject + m.snippet).toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const todayMsgs = filtered.filter((m) => isToday(m.date));
  const earlierMsgs = filtered.filter((m) => !isToday(m.date));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function acctInitials(a: Account): string {
    if (a.name) return getInitials(a.name);
    return getInitials(a.email.split("@")[0]);
  }

  function acctGradient(a: Account): string {
    return getGradient(a.id + a.email);
  }

  return (
    <div className="inbox-page">
      {/* Titlebar */}
      <div className="titlebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <span>Gmail AI</span>
        </div>
        <div className="path">
          <span className="sep">/</span>
          <span style={{ color: "var(--fg-dim)" }}>inbox</span>
        </div>
        <div className="right">
          <span>
            <span className="kbd">⌘</span> <span className="kbd">K</span> search
          </span>
          <span>
            <span className="kbd">⌘</span> <span className="kbd">N</span> compose
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="crumbs">
          <Link href="/" className="seg">
            <Icon name="home" size={13} />
          </Link>
          <span className="seg active">
            <Icon name="inbox" size={12} /> Inbox
          </span>
          <Link href="/compose" className="seg">
            <Icon name="sparkle" size={12} /> Reply Composer
          </Link>
          <Link href="/templates" className="seg">
            <Icon name="template" size={13} /> Templates
          </Link>
        </div>

        <button
          className="acct"
          onClick={(e) => {
            setAcctRect(e.currentTarget.getBoundingClientRect());
            setAcctOpen((v) => !v);
          }}
        >
          <span
            className="avatar"
            style={{
              background: acctGradient(currentAccount),
              width: 18,
              height: 18,
              fontSize: "10px",
            }}
          >
            {acctInitials(currentAccount)}
          </span>
          <span className="mail">{currentAccount.email}</span>
          <Icon name="chev" size={11} className="caret" />
        </button>

        {acctOpen && acctRect && (
          <>
            <div
              onClick={() => setAcctOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 20 }}
            />
            <div
              className="dropdown acct-dd"
              style={{ top: acctRect.bottom + 6, left: acctRect.left }}
            >
              <div className="grp-h">accounts</div>
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="opt"
                  onClick={() => {
                    setAcctOpen(false);
                    router.push(`/account/${encodeURIComponent(a.id)}`);
                  }}
                >
                  <span
                    className="avatar"
                    style={{
                      background: acctGradient(a),
                      width: 22,
                      height: 22,
                      fontSize: "10px",
                    }}
                  >
                    {acctInitials(a)}
                  </span>
                  <div className="info">
                    <span className="name">{a.name ?? a.email.split("@")[0]}</span>
                    <span className="mail">{a.email}</span>
                  </div>
                  {a.id === currentAccount.id && (
                    <Icon name="check" size={13} className="check" />
                  )}
                </div>
              ))}
              <div className="sep" />
              <Link
                href="/api/auth/google"
                className="opt"
                onClick={() => setAcctOpen(false)}
                style={{ color: "var(--fg-dim)" }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: "1px dashed var(--line-2)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
                <div className="info">
                  <span className="name">アカウントを追加</span>
                </div>
              </Link>
            </div>
          </>
        )}

        <div className="tools-right">
          <button className="icon-btn" title="更新" onClick={() => router.refresh()}>
            <Icon name="refresh" />
          </button>
          <button className="icon-btn" title="設定">
            <Icon name="settings" />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        {/* Sidebar */}
        <div className="pane side">
          <button className="compose-btn">
            <Icon name="plus" size={13} />
            <span className="lbl">作成</span>
            <span className="kbd-inline">⌘N</span>
          </button>

          <div className="grp">mailboxes</div>
          <div className="nav">
            <div className="nav-item active">
              <span className="ico"><Icon name="inbox" size={13} /></span>
              <span className="lbl">受信トレイ</span>
              <span className="count">{messages.length}</span>
            </div>
          </div>
        </div>

        {/* List pane */}
        <div className="pane">
          <div className="pane-head">
            <span className="label">
              inbox <b>/ {currentAccount.email}</b>
            </span>
            <div className="right">
              <span className="tag amber">未読 {unreadCount}</span>
              <span className="tag blue">AI 0</span>
              <span className="tag zinc">
                {filtered.length}/{messages.length}
              </span>
            </div>
          </div>

          <div className="list-toolbar">
            <button
              className={"fchip" + (filter === "all" ? " on" : "")}
              onClick={() => setFilter("all")}
            >
              すべて <span className="num">{messages.length}</span>
            </button>
            <button
              className={"fchip" + (filter === "unread" ? " on" : "")}
              onClick={() => setFilter("unread")}
            >
              未読 <span className="num">{unreadCount}</span>
            </button>
            <div className="search">
              <Icon name="search" size={13} />
              <input
                ref={searchRef}
                placeholder="差出人・件名・本文を検索…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="kbd">⌘K</span>
            </div>
          </div>

          <div className="col-head">
            <span />
            <span />
            <span />
            <span>from</span>
            <span>subject · preview</span>
            <span style={{ textAlign: "right" }}>labels · ai</span>
            <span style={{ textAlign: "right" }}>received</span>
          </div>

          {fetchError ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--danger)",
                fontFamily: "var(--mono)",
                fontSize: 12,
              }}
            >
              {fetchError}
            </div>
          ) : (
            <div className="list">
              {todayMsgs.length > 0 && (
                <div className="day-sep">
                  <span>today</span>
                  <span className="line" />
                  <span className="count">{todayMsgs.length} 件</span>
                </div>
              )}
              {todayMsgs.map((m) => (
                <EmailRow key={m.id} msg={m} accountId={accountId} />
              ))}

              {earlierMsgs.length > 0 && (
                <div className="day-sep">
                  <span>earlier</span>
                  <span className="line" />
                  <span className="count">{earlierMsgs.length} 件</span>
                </div>
              )}
              {earlierMsgs.map((m) => (
                <EmailRow key={m.id} msg={m} accountId={accountId} />
              ))}

              {filtered.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--fg-faint)",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                  }}
                >
                  該当するメッセージはありません
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statusbar */}
      <div className="statusbar">
        <span className="item">
          <span className="dot" /> connected · IMAP/SMTP
        </span>
        <span className="item">claude haiku-4-5</span>
        <span className="item">
          syncing · {messages.length} messages
        </span>
        <span className="item">unread · {unreadCount}</span>
        <span className="item right">UTF-8 · ja-JP</span>
        <span className="item right">v0.4.2-dev</span>
      </div>
    </div>
  );
}
