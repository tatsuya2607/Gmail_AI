"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GmailMessage } from "@/lib/google";

interface Account {
  id: string;
  email: string;
  name: string | null;
}

interface Label {
  id: number;
  account_id: string;
  name: string;
  color: string;
  created_at: number;
}

interface LabelRule {
  id: number;
  label_id: number;
  pattern: string;
  created_at: number;
}

interface Props {
  messages: GmailMessage[];
  accounts: Account[];
  currentAccount: Account;
  accountId: string;
  fetchError: string | null;
  initialNextPageToken?: string;
  labels: Label[];
  labelRules: LabelRule[];
  initialTrashedMessages?: GmailMessage[];
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

const LABEL_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
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

function formatWhen(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).toLowerCase().trim();
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
    case "star":
      return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "star-fill":
      return <svg {...p} fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "trash":
      return <svg {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    case "tag":
      return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    default:
      return null;
  }
}

function EmailRow({
  msg,
  accountId,
  isLoading,
  onNavigate,
  isStarred,
  onStar,
  onToggleSelect,
  isSelected,
  msgLabels,
}: {
  msg: GmailMessage;
  accountId: string;
  isLoading: boolean;
  onNavigate: (id: string) => void;
  isStarred: boolean;
  onStar: (id: string, starred: boolean) => void;
  onToggleSelect: (id: string) => void;
  isSelected: boolean;
  msgLabels: Label[];
}) {
  const { name, org } = parseSender(msg.from);
  const initials = getInitials(name || msg.from);
  const grad = getGradient(msg.from);
  const href = `/compose/${msg.id}?accountId=${encodeURIComponent(accountId)}`;

  return (
    <Link
      href={href}
      className={
        "row" +
        (msg.isUnread ? " unread" : "") +
        (isLoading ? " nav-loading" : "") +
        (isSelected ? " selected" : "")
      }
      onClick={(ev) => {
        // Don't navigate if clicking interactive elements
        if ((ev.target as HTMLElement).closest(".checkbox-area, .star-btn")) return;
        onNavigate(msg.id);
      }}
    >
      <span className="accent" />
      <span
        role="button"
        className={"checkbox-area" + (isSelected ? " checked" : "")}
        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onToggleSelect(msg.id); }}
      >
        {isSelected && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span
        role="button"
        className={"star-btn" + (isStarred ? " starred" : "")}
        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onStar(msg.id, !isStarred); }}
      >
        {isStarred ? <Icon name="star-fill" size={17} /> : <Icon name="star" size={17} />}
      </span>
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
      <span className="tags">
        {msgLabels.map((label) => (
          <span
            key={label.id}
            className="label-chip"
            style={{
              backgroundColor: `${label.color}22`,
              color: label.color,
              border: `1px solid ${label.color}55`,
            }}
          >
            <span className="label-chip-dot" style={{ background: label.color }} />
            {label.name}
          </span>
        ))}
      </span>
      {isLoading ? (
        <span className="row-spinner" />
      ) : (
        <span className="when">{formatWhen(msg.date)}</span>
      )}
    </Link>
  );
}

export function InboxClient({
  messages,
  accounts,
  currentAccount,
  accountId,
  fetchError,
  initialNextPageToken,
  labels: propLabels,
  labelRules: propLabelRules,
  initialTrashedMessages = [],
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<"inbox" | "starred" | "trash">("inbox");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctRect, setAcctRect] = useState<DOMRect | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [extraMessages, setExtraMessages] = useState<GmailMessage[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localStars, setLocalStars] = useState<Record<string, boolean>>({});
  const [trashedMessages, setTrashedMessages] = useState<GmailMessage[]>(initialTrashedMessages);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const lastHiddenRef = useRef<number>(0);

  // Compose modal state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeSentOk, setComposeSentOk] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  // Label state
  const [activeLabel, setActiveLabel] = useState<number | null>(null);
  const [labels, setLabels] = useState<Label[]>(propLabels);
  const [labelRules, setLabelRules] = useState<LabelRule[]>(propLabelRules);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [expandedLabelId, setExpandedLabelId] = useState<number | null>(null);
  const [newRulePattern, setNewRulePattern] = useState("");

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        lastHiddenRef.current = Date.now();
      } else if (document.visibilityState === "visible") {
        if (Date.now() - lastHiddenRef.current > 1500) {
          setLoadingId(null);
          setExtraMessages([]);
          setNextToken(initialNextPageToken);
          router.refresh();
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router, initialNextPageToken]);

  useEffect(() => {
    setNextToken(initialNextPageToken);
  }, [initialNextPageToken]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null;
      if (saved) setTheme(saved);
      else setTheme("system");
    } catch {}
  }, []);

  function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setExtraMessages([]);
    setNextToken(undefined);
    setLoadingId(null);
    setLocalStars({});
    setTrashedMessages([]);
    // Full page reload is the most reliable way to re-fetch server data
    window.location.reload();
  }

  async function loadMore() {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/messages?accountId=${encodeURIComponent(accountId)}&pageToken=${encodeURIComponent(nextToken)}`
      );
      const data = await res.json();
      if (res.ok) {
        setExtraMessages((prev) => [...prev, ...data.messages]);
        setNextToken(data.nextPageToken ?? undefined);
      }
    } catch {}
    setLoadingMore(false);
  }

  function applyTheme(t: "system" | "light" | "dark") {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
      } else {
        localStorage.setItem("theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  }

  async function handleStar(msgId: string, starred: boolean) {
    setLocalStars((prev) => ({ ...prev, [msgId]: starred }));
    try {
      await fetch(`/api/messages/${msgId}/star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, starred }),
      });
    } catch {}
  }

  function handleToggleSelect(msgId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }

  async function handleTrashSelected() {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const toTrash = allMessages.filter((m) => ids.includes(m.id));
    setTrashedMessages((prev) => [...prev, ...toTrash]);
    setSelectedIds(new Set());
    await Promise.all(
      toTrash.map((msg) =>
        fetch(`/api/messages/${msg.id}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId, messageSnapshot: msg }),
        }).catch(() => {})
      )
    );
  }

  async function handleRestoreSelected() {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setTrashedMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    setSelectedIds(new Set());
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/messages/${id}/restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId }),
        }).catch(() => {})
      )
    );
    window.location.reload();
  }

  function handlePermanentDeleteSelected() {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setTrashedMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    setSelectedIds(new Set());
    // Messages are already in Gmail's Trash and will auto-purge after 30 days
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    const tempId = -(Date.now());
    const newLabel: Label = {
      id: tempId,
      account_id: accountId,
      name: newLabelName.trim(),
      color: newLabelColor,
      created_at: Date.now(),
    };
    setLabels((prev) => [...prev, newLabel]);
    setNewLabelName("");
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, name: newLabel.name, color: newLabel.color }),
      });
      const data = await res.json();
      if (res.ok) {
        setLabels((prev) => prev.map((l) => (l.id === tempId ? { ...l, id: data.id } : l)));
      } else {
        setLabels((prev) => prev.filter((l) => l.id !== tempId));
      }
    } catch {
      setLabels((prev) => prev.filter((l) => l.id !== tempId));
    }
  }

  async function handleDeleteLabel(labelId: number) {
    setLabels((prev) => prev.filter((l) => l.id !== labelId));
    setLabelRules((prev) => prev.filter((r) => r.label_id !== labelId));
    if (activeLabel === labelId) {
      setActiveLabel(null);
    }
    try {
      await fetch(`/api/labels/${labelId}`, { method: "DELETE" });
    } catch {}
  }

  async function handleAddRule(labelId: number, pattern: string) {
    if (!pattern.trim()) return;
    const tempId = -(Date.now());
    const newRule: LabelRule = {
      id: tempId,
      label_id: labelId,
      pattern: pattern.trim().toLowerCase(),
      created_at: Date.now(),
    };
    setLabelRules((prev) => [...prev, newRule]);
    setNewRulePattern("");
    try {
      const res = await fetch(`/api/labels/${labelId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: newRule.pattern }),
      });
      const data = await res.json();
      if (res.ok) {
        setLabelRules((prev) =>
          prev.map((r) => (r.id === tempId ? { ...r, id: data.id } : r))
        );
      } else {
        setLabelRules((prev) => prev.filter((r) => r.id !== tempId));
      }
    } catch {
      setLabelRules((prev) => prev.filter((r) => r.id !== tempId));
    }
  }

  async function handleDeleteRule(labelId: number, ruleId: number) {
    setLabelRules((prev) => prev.filter((r) => r.id !== ruleId));
    try {
      await fetch(`/api/labels/${labelId}/rules/${ruleId}`, { method: "DELETE" });
    } catch {}
  }

  async function handleNewEmailSend() {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || composeSending) return;
    setComposeSending(true);
    setComposeError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          replyBody: composeBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComposeSentOk(true);
      setTimeout(() => {
        setComposeOpen(false);
        setComposeSentOk(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
      }, 1500);
    } catch (err) {
      setComposeError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setComposeSending(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setComposeOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const trashedIds = useMemo(
    () => new Set(trashedMessages.map((m) => m.id)),
    [trashedMessages]
  );

  const allMessages = useMemo(
    () => [...messages, ...extraMessages].filter((m) => !trashedIds.has(m.id)),
    [messages, extraMessages, trashedIds]
  );

  const messageLabelMap = useMemo(() => {
    const map = new Map<string, Label[]>();
    for (const msg of [...allMessages, ...trashedMessages]) {
      const email = extractEmail(msg.from);
      const domain = email.split("@")[1] ?? "";
      const matching = labels.filter((label) => {
        const rules = labelRules.filter((r) => r.label_id === label.id);
        return rules.some((r) => r.pattern === email || r.pattern === domain);
      });
      if (matching.length > 0) map.set(msg.id, matching);
    }
    return map;
  }, [allMessages, labels, labelRules]);

  const unreadCount = allMessages.filter((m) => m.isUnread).length;

  const starredCount = allMessages.filter((m) => {
    const starred = m.id in localStars ? localStars[m.id] : m.isStarred;
    return starred;
  }).length;

  const labelCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const label of labels) {
      const rules = labelRules.filter((r) => r.label_id === label.id);
      counts[label.id] = allMessages.filter((m) => {
        const email = extractEmail(m.from);
        const domain = email.split("@")[1] ?? "";
        return rules.some((r) => r.pattern === email || r.pattern === domain);
      }).length;
    }
    return counts;
  }, [allMessages, labels, labelRules]);

  // View-level filter (inbox / starred / label), before read-filter
  const viewFiltered = allMessages.filter((m) => {
    if (view === "trash") return false;
    const starred = m.id in localStars ? localStars[m.id] : m.isStarred;

    if (activeLabel !== null) {
      const rules = labelRules.filter((r) => r.label_id === activeLabel);
      const email = extractEmail(m.from);
      const domain = email.split("@")[1] ?? "";
      if (!rules.some((r) => r.pattern === email || r.pattern === domain)) return false;
    } else if (view === "starred") {
      if (!starred) return false;
    }

    if (query) {
      const hay = (m.from + m.subject + m.snippet).toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  // Secondary read filter applied on top of view filter
  const filtered = readFilter === "unread"
    ? viewFiltered.filter((m) => m.isUnread)
    : viewFiltered;

  const viewUnreadCount = viewFiltered.filter((m) => m.isUnread).length;

  // Trash view list
  const trashFiltered = trashedMessages.filter((m) => {
    if (readFilter === "unread" && !m.isUnread) return false;
    if (query) {
      const hay = (m.from + m.subject + m.snippet).toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const displayMessages = view === "trash" ? trashFiltered : filtered;

  const allInViewSelected =
    displayMessages.length > 0 && displayMessages.every((m) => selectedIds.has(m.id));
  const someSelected = selectedIds.size > 0 && !allInViewSelected;

  function handleSelectAll() {
    if (allInViewSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayMessages.map((m) => m.id)));
    }
  }

  function acctInitials(a: Account): string {
    if (a.name) return getInitials(a.name);
    return getInitials(a.email.split("@")[0]);
  }

  function acctGradient(a: Account): string {
    return getGradient(a.id + a.email);
  }

  const inboxNavActive = activeLabel === null && view === "inbox";
  const starredNavActive = activeLabel === null && view === "starred";
  const trashNavActive = view === "trash";

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
          <button className="icon-btn" title="更新" onClick={handleRefresh} disabled={isRefreshing}>
            <Icon name="refresh" className={isRefreshing ? "spin" : ""} />
          </button>
          <button className="icon-btn" title="設定" onClick={() => setSettingsOpen(true)}>
            <Icon name="settings" />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        {/* Sidebar */}
        <div className="pane side">
          <button className="compose-btn" onClick={() => setComposeOpen(true)}>
            <Icon name="plus" size={13} />
            <span className="lbl">作成</span>
          </button>

          <div className="grp">mailboxes</div>
          <div className="nav">
            <div
              className={"nav-item" + (inboxNavActive ? " active" : "")}
              onClick={() => { setView("inbox"); setActiveLabel(null); }}
            >
              <span className="ico"><Icon name="inbox" size={13} /></span>
              <span className="lbl">受信トレイ</span>
              <span className="count">{allMessages.length}</span>
            </div>
            <div
              className={"nav-item" + (starredNavActive ? " active" : "")}
              onClick={() => { setView("starred"); setActiveLabel(null); }}
            >
              <span className="ico"><Icon name="star" size={13} /></span>
              <span className="lbl">スター付き</span>
              <span className="count">{starredCount}</span>
            </div>
            <div
              className={"nav-item trash-nav" + (trashNavActive ? " active" : "")}
              onClick={() => { setView("trash"); setActiveLabel(null); setSelectedIds(new Set()); }}
            >
              <span className="ico"><Icon name="trash" size={13} /></span>
              <span className="lbl">ゴミ箱</span>
              {trashedMessages.length > 0 && (
                <span className="count">{trashedMessages.length}</span>
              )}
            </div>
          </div>

          {labels.length > 0 && (
            <>
              <div className="grp">labels</div>
              <div className="nav">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className={"nav-item" + (activeLabel === label.id ? " active" : "")}
                    onClick={() => { setActiveLabel(label.id); setView("inbox"); }}
                  >
                    <span className="ico">
                      <span className="nav-label-dot" style={{ background: label.color }} />
                    </span>
                    <span className="lbl">{label.name}</span>
                    <span className="count">{labelCounts[label.id] ?? 0}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="nav" style={{ marginTop: 4 }}>
            <div className="nav-item label-manage-item" onClick={() => setLabelModalOpen(true)}>
              <span className="ico"><Icon name="tag" size={12} /></span>
              <span className="lbl">ラベルを管理</span>
            </div>
          </div>
        </div>

        {/* List pane */}
        <div className="pane">
          <div className={"pane-head" + (view === "trash" ? " trash-head" : "")}>
            <span className="label">
              {view === "trash" ? (
                <>ゴミ箱 <b>/ {currentAccount.email}</b></>
              ) : (
                <>inbox <b>/ {currentAccount.email}</b></>
              )}
            </span>
            <div className="right">
              {view === "trash" ? (
                <span className="tag zinc">{trashFiltered.length}件</span>
              ) : (
                <>
                  <span className="tag amber">未読 {unreadCount}件</span>
                  <span className="tag zinc">
                    表示 {filtered.length} / 読込 {allMessages.length}{nextToken ? "+" : ""}件
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={"list-toolbar" + (selectedIds.size > 0 ? " selecting" : "")}>
            {/* Select-all checkbox — always visible */}
            <span
              role="button"
              className={
                "select-all-box" +
                (allInViewSelected ? " checked" : someSelected ? " indeterminate" : "")
              }
              onClick={handleSelectAll}
              title={allInViewSelected ? "全選択解除" : "全選択"}
            >
              {allInViewSelected && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {someSelected && !allInViewSelected && (
                <span className="select-all-dash" />
              )}
            </span>

            {selectedIds.size > 0 ? (
              <>
                <span className="sel-count">{selectedIds.size}件選択中</span>
                <button className="sel-cancel" onClick={() => setSelectedIds(new Set())}>
                  キャンセル
                </button>
                {view === "trash" ? (
                  <>
                    <button className="sel-restore" onClick={handleRestoreSelected}>
                      <Icon name="refresh" size={13} />
                      元に戻す
                    </button>
                    <button className="sel-delete" onClick={handlePermanentDeleteSelected}>
                      <Icon name="trash" size={13} />
                      完全削除
                    </button>
                  </>
                ) : (
                  <button className="sel-delete" onClick={handleTrashSelected}>
                    <Icon name="trash" size={13} />
                    ゴミ箱へ移動
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  className={"fchip" + (readFilter === "all" ? " on" : "")}
                  onClick={() => setReadFilter("all")}
                >
                  すべて <span className="num">{viewFiltered.length}</span>
                </button>
                <button
                  className={"fchip" + (readFilter === "unread" ? " on" : "")}
                  onClick={() => setReadFilter("unread")}
                >
                  未読 <span className="num">{viewUnreadCount}</span>
                </button>
                {activeLabel !== null && (
                  <span className="active-label-chip">
                    <span
                      className="label-chip-dot"
                      style={{ background: labels.find((l) => l.id === activeLabel)?.color }}
                    />
                    {labels.find((l) => l.id === activeLabel)?.name}
                    <span
                      role="button"
                      style={{ marginLeft: 4, cursor: "pointer", opacity: 0.6 }}
                      onClick={() => { setActiveLabel(null); setView("inbox"); }}
                    >
                      ✕
                    </span>
                  </span>
                )}
                <div className="search">
                  <Icon name="search" size={13} />
                  <input
                    ref={searchRef}
                    placeholder="差出人・件名・本文を検索…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </>
            )}
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
              {displayMessages.map((m) => (
                <EmailRow
                  key={m.id}
                  msg={m}
                  accountId={accountId}
                  isLoading={loadingId === m.id}
                  onNavigate={view === "trash" ? () => {} : setLoadingId}
                  isStarred={m.id in localStars ? localStars[m.id] : m.isStarred}
                  onStar={handleStar}
                  onToggleSelect={handleToggleSelect}
                  isSelected={selectedIds.has(m.id)}
                  msgLabels={messageLabelMap.get(m.id) ?? []}
                />
              ))}

              {displayMessages.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--fg-faint)",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                  }}
                >
                  {view === "trash" ? "ゴミ箱は空です" : "該当するメッセージはありません"}
                </div>
              )}

              {nextToken && view !== "trash" && (
                <div className="load-more-wrap">
                  <button
                    className="load-more-btn"
                    disabled={loadingMore}
                    onClick={loadMore}
                  >
                    {loadingMore ? "読み込み中…" : `もっと読み込む · ${allMessages.length}件表示中`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statusbar */}
      <div className="statusbar">
        <span className="item">
          <span className="dot" /> connected
        </span>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="modal-backdrop" onClick={() => { setComposeOpen(false); setComposeError(null); setComposeSentOk(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>新規メール作成</span>
              <button className="icon-btn" style={{ fontSize: 16, color: "var(--fg-mute)" }} onClick={() => setComposeOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>To</label>
                <input type="email" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="recipient@example.com" />
              </div>
              <div className="field">
                <label>件名</label>
                <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="件名を入力..." />
              </div>
              <div className="field">
                <label>本文</label>
                <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="メール本文を入力..." rows={8} />
              </div>
              {composeError && <div className="modal-error">{composeError}</div>}
              {composeSentOk && <div className="modal-success">送信しました</div>}
            </div>
            <div className="modal-foot">
              <button className="modal-btn-ghost" onClick={() => setComposeOpen(false)}>キャンセル</button>
              <button
                className="modal-btn-primary"
                disabled={!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || composeSending}
                onClick={handleNewEmailSend}
              >
                {composeSending ? "送信中…" : "送信"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>設定</span>
              <button className="icon-btn" style={{ fontSize: 16, color: "var(--fg-mute)" }} onClick={() => setSettingsOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <div className="settings-label">テーマ</div>
                <div className="theme-toggle">
                  <button className={theme === "system" ? "on" : ""} onClick={() => applyTheme("system")}>システム</button>
                  <button className={theme === "light" ? "on" : ""} onClick={() => applyTheme("light")}>ライト</button>
                  <button className={theme === "dark" ? "on" : ""} onClick={() => applyTheme("dark")}>ダーク</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Label Modal */}
      {labelModalOpen && (
        <div className="modal-backdrop" onClick={() => { setLabelModalOpen(false); setExpandedLabelId(null); setNewRulePattern(""); }}>
          <div className="modal modal-label" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>ラベルの管理</span>
              <button className="icon-btn" style={{ fontSize: 16, color: "var(--fg-mute)" }} onClick={() => { setLabelModalOpen(false); setExpandedLabelId(null); setNewRulePattern(""); }}>✕</button>
            </div>
            <div className="modal-body">
              {/* Create new label */}
              <div className="modal-section-title">新しいラベル</div>
              <div className="label-create-row">
                <input
                  className="label-name-input"
                  placeholder="ラベル名..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newLabelName.trim()) handleCreateLabel(); }}
                />
                <div className="color-picker">
                  {LABEL_COLORS.map((c) => (
                    <span
                      key={c}
                      role="button"
                      className={"color-swatch" + (newLabelColor === c ? " selected" : "")}
                      style={{ background: c }}
                      onClick={() => setNewLabelColor(c)}
                    />
                  ))}
                </div>
                <button
                  className="modal-btn-primary"
                  disabled={!newLabelName.trim()}
                  onClick={handleCreateLabel}
                >
                  作成
                </button>
              </div>

              {/* Existing labels */}
              {labels.length > 0 && (
                <>
                  <div className="modal-section-title" style={{ marginTop: 16 }}>既存のラベル</div>
                  <div className="label-list">
                    {labels.map((label) => {
                      const rules = labelRules.filter((r) => r.label_id === label.id);
                      const isExpanded = expandedLabelId === label.id;
                      return (
                        <div key={label.id} className="label-accordion">
                          <div className="label-accordion-head">
                            <span className="label-dot" style={{ background: label.color }} />
                            <span className="label-acc-name">{label.name}</span>
                            <span className="label-rule-count">{rules.length} ルール</span>
                            <span
                              role="button"
                              className={"label-expand-btn" + (isExpanded ? " open" : "")}
                              onClick={() => {
                                setExpandedLabelId(isExpanded ? null : label.id);
                                setNewRulePattern("");
                              }}
                            >
                              <Icon name="chev" size={12} />
                            </span>
                            <span
                              role="button"
                              className="label-delete-btn"
                              onClick={() => handleDeleteLabel(label.id)}
                            >
                              <Icon name="trash" size={12} />
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="label-accordion-body">
                              {rules.length === 0 && (
                                <div className="rule-empty">パターンが登録されていません</div>
                              )}
                              <div className="rule-list">
                                {rules.map((rule) => (
                                  <div key={rule.id} className="rule-item">
                                    <span className="rule-pattern">{rule.pattern}</span>
                                    <span
                                      role="button"
                                      className="rule-delete"
                                      onClick={() => handleDeleteRule(label.id, rule.id)}
                                    >
                                      ✕
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="rule-add-row">
                                <input
                                  className="rule-input"
                                  placeholder="user@example.com または example.com"
                                  value={newRulePattern}
                                  onChange={(e) => setNewRulePattern(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newRulePattern.trim()) {
                                      handleAddRule(label.id, newRulePattern);
                                    }
                                  }}
                                />
                                <button
                                  className="modal-btn-primary"
                                  style={{ padding: "5px 12px", fontSize: 12 }}
                                  disabled={!newRulePattern.trim()}
                                  onClick={() => handleAddRule(label.id, newRulePattern)}
                                >
                                  追加
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
