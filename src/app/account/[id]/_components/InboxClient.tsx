"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { GmailMessage } from "@/lib/google";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { PageToolbar } from "@/components/PageToolbar";
import { InboxSidebar } from "./InboxSidebar";
import { Icon } from "./Icon";
import { MessageList } from "./MessageList";
import { ComposeModal } from "./ComposeModal";
import { LabelModal } from "./LabelModal";
import { extractEmail } from "./utils";
import type { Account, Label, LabelRule } from "./types";

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

export function InboxClient({
  messages, accounts, currentAccount, accountId, fetchError,
  initialNextPageToken,
  labels: propLabels, labelRules: propLabelRules,
  initialTrashedMessages = [],
}: Props) {
  const router = useRouter();

  // ── ビュー・フィルター ──
  const [view, setView] = useState<"inbox" | "starred" | "trash">("inbox");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [activeLabel, setActiveLabel] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // ── メール ──
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [extraMessages, setExtraMessages] = useState<GmailMessage[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localStars, setLocalStars] = useState<Record<string, boolean>>({});
  const [trashedMessages, setTrashedMessages] = useState<GmailMessage[]>(initialTrashedMessages);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastHiddenRef = useRef<number>(0);

  // ── モーダル ──
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  // ── ラベル ──
  const [labels, setLabels] = useState<Label[]>(propLabels);
  const [labelRules, setLabelRules] = useState<LabelRule[]>(propLabelRules);

  // ── Effects ──
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

  useEffect(() => { setNextToken(initialNextPageToken); }, [initialNextPageToken]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null;
      setTheme(saved ?? "system");
    } catch {}
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") { e.preventDefault(); setComposeOpen(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── ハンドラ ──
  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setExtraMessages([]);
    setNextToken(undefined);
    setLoadingId(null);
    setLocalStars({});
    setTrashedMessages([]);
    try {
      await fetch(`/api/messages/invalidate?accountId=${encodeURIComponent(accountId)}`, { method: "DELETE" });
    } catch {}
    window.location.reload();
  }

  async function loadMore() {
    if (!nextToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/messages?accountId=${encodeURIComponent(accountId)}&pageToken=${encodeURIComponent(nextToken)}`);
      const data = await res.json();
      if (res.ok) { setExtraMessages((prev) => [...prev, ...data.messages]); setNextToken(data.nextPageToken ?? undefined); }
    } catch {}
    setLoadingMore(false);
  }

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

  async function handleStar(msgId: string, starred: boolean) {
    setLocalStars((prev) => ({ ...prev, [msgId]: starred }));
    fetch(`/api/messages/${msgId}/star`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, starred }),
    }).catch(() => {});
  }

  function handleToggleSelect(msgId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) { next.delete(msgId); } else { next.add(msgId); }
      return next;
    });
  }

  async function handleTrashSelected() {
    if (selectedIds.size === 0) return;
    const toTrash = allMessages.filter((m) => selectedIds.has(m.id));
    setTrashedMessages((prev) => [...prev, ...toTrash]);
    setSelectedIds(new Set());
    await Promise.all(toTrash.map((msg) =>
      fetch(`/api/messages/${msg.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, messageSnapshot: msg }),
      }).catch(() => {})
    ));
  }

  async function handleRestoreSelected() {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setTrashedMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    setSelectedIds(new Set());
    await Promise.all(ids.map((id) =>
      fetch(`/api/messages/${id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      }).catch(() => {})
    ));
    window.location.reload();
  }

  async function handlePermanentDelete() {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setTrashedMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    setSelectedIds(new Set());
    await Promise.all(ids.map((id) =>
      fetch(`/api/messages/${id}/delete?accountId=${encodeURIComponent(accountId)}`, { method: "DELETE" }).catch(() => {})
    ));
  }

  async function handleCreateLabel(name: string, color: string) {
    const tempId = -(Date.now());
    const newLabel: Label = { id: tempId, account_id: accountId, name, color, created_at: Date.now() };
    setLabels((prev) => [...prev, newLabel]);
    try {
      const res = await fetch("/api/labels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId, name, color }) });
      const data = await res.json();
      if (res.ok) setLabels((prev) => prev.map((l) => (l.id === tempId ? { ...l, id: data.id } : l)));
      else setLabels((prev) => prev.filter((l) => l.id !== tempId));
    } catch { setLabels((prev) => prev.filter((l) => l.id !== tempId)); }
  }

  async function handleDeleteLabel(labelId: number) {
    setLabels((prev) => prev.filter((l) => l.id !== labelId));
    setLabelRules((prev) => prev.filter((r) => r.label_id !== labelId));
    if (activeLabel === labelId) setActiveLabel(null);
    fetch(`/api/labels/${labelId}`, { method: "DELETE" }).catch(() => {});
  }

  async function handleAddRule(labelId: number, pattern: string) {
    if (!pattern.trim()) return;
    const tempId = -(Date.now());
    const newRule: LabelRule = { id: tempId, label_id: labelId, pattern: pattern.trim().toLowerCase(), created_at: Date.now() };
    setLabelRules((prev) => [...prev, newRule]);
    try {
      const res = await fetch(`/api/labels/${labelId}/rules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pattern: newRule.pattern }) });
      const data = await res.json();
      if (res.ok) setLabelRules((prev) => prev.map((r) => (r.id === tempId ? { ...r, id: data.id } : r)));
      else setLabelRules((prev) => prev.filter((r) => r.id !== tempId));
    } catch { setLabelRules((prev) => prev.filter((r) => r.id !== tempId)); }
  }

  async function handleDeleteRule(labelId: number, ruleId: number) {
    setLabelRules((prev) => prev.filter((r) => r.id !== ruleId));
    fetch(`/api/labels/${labelId}/rules/${ruleId}`, { method: "DELETE" }).catch(() => {});
  }

  // ── 派生値 ──
  const trashedIds = useMemo(() => new Set(trashedMessages.map((m) => m.id)), [trashedMessages]);
  const allMessages = useMemo(() => [...messages, ...extraMessages].filter((m) => !trashedIds.has(m.id)), [messages, extraMessages, trashedIds]);

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
  }, [allMessages, trashedMessages, labels, labelRules]);

  const unreadCount = allMessages.filter((m) => m.isUnread).length;
  const starredCount = allMessages.filter((m) => (m.id in localStars ? localStars[m.id] : m.isStarred)).length;

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

  const viewFiltered = allMessages.filter((m) => {
    if (view === "trash") return false;
    const starred = m.id in localStars ? localStars[m.id] : m.isStarred;
    if (activeLabel !== null) {
      const rules = labelRules.filter((r) => r.label_id === activeLabel);
      const email = extractEmail(m.from);
      const domain = email.split("@")[1] ?? "";
      if (!rules.some((r) => r.pattern === email || r.pattern === domain)) return false;
    } else if (view === "starred" && !starred) return false;
    if (query) {
      if (!(m.from + m.subject + m.snippet).toLowerCase().includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const filtered = readFilter === "unread" ? viewFiltered.filter((m) => m.isUnread) : viewFiltered;
  const viewUnreadCount = viewFiltered.filter((m) => m.isUnread).length;

  const trashFiltered = trashedMessages.filter((m) => {
    if (readFilter === "unread" && !m.isUnread) return false;
    if (query && !(m.from + m.subject + m.snippet).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const displayMessages = view === "trash" ? trashFiltered : filtered;
  const allInViewSelected = displayMessages.length > 0 && displayMessages.every((m) => selectedIds.has(m.id));
  const someSelected = selectedIds.size > 0 && !allInViewSelected;

  function handleSelectAll() {
    if (allInViewSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(displayMessages.map((m) => m.id)));
  }

  return (
    <div className="inbox-page">
      <AppHeader
        pathSegments={[{ label: "inbox", dim: true }]}
        right={
          <button className="icon-btn" title="設定" onClick={() => setSettingsOpen(true)}>
            <Icon name="settings" />
          </button>
        }
      />

      <PageToolbar
        accountId={accountId}
        accounts={accounts}
        crumbs={[
          { icon: "home", href: "/" },
          { icon: "inbox", label: "Inbox", active: true },
          { icon: "template", label: "Templates", href: "/templates" },
        ]}
        tools={
          <button className="icon-btn" title="更新" onClick={handleRefresh} disabled={isRefreshing}>
            <Icon name="refresh" className={isRefreshing ? "spin" : ""} />
          </button>
        }
      />

      <div className="main">
        <InboxSidebar
          view={view}
          activeLabel={activeLabel}
          allMessages={allMessages}
          trashedMessages={trashedMessages}
          starredCount={starredCount}
          labels={labels}
          labelCounts={labelCounts}
          onSetView={(v) => { setView(v); setSelectedIds(new Set()); }}
          onSetActiveLabel={setActiveLabel}
          onCompose={() => setComposeOpen(true)}
          onManageLabels={() => setLabelModalOpen(true)}
        />

        <MessageList
          view={view}
          currentAccountEmail={currentAccount.email}
          accountId={accountId}
          displayMessages={displayMessages}
          fetchError={fetchError}
          nextToken={nextToken}
          loadingMore={loadingMore}
          allMessagesCount={allMessages.length}
          onLoadMore={loadMore}
          readFilter={readFilter}
          setReadFilter={setReadFilter}
          viewFilteredCount={viewFiltered.length}
          viewUnreadCount={viewUnreadCount}
          trashFilteredCount={trashFiltered.length}
          unreadCount={unreadCount}
          filteredCount={filtered.length}
          selectedIds={selectedIds}
          allInViewSelected={allInViewSelected}
          someSelected={someSelected}
          onSelectAll={handleSelectAll}
          onCancelSelect={() => setSelectedIds(new Set())}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          activeLabel={activeLabel}
          labels={labels}
          onClearLabel={() => { setActiveLabel(null); setView("inbox"); }}
          loadingId={loadingId}
          localStars={localStars}
          messageLabelMap={messageLabelMap}
          onNavigate={setLoadingId}
          onStar={handleStar}
          onToggleSelect={handleToggleSelect}
          onTrashSelected={handleTrashSelected}
          onRestoreSelected={handleRestoreSelected}
          onPermanentDelete={handlePermanentDelete}
        />
      </div>

      <AppFooter />

      {composeOpen && <ComposeModal accountId={accountId} onClose={() => setComposeOpen(false)} />}

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

      {labelModalOpen && (
        <LabelModal
          labels={labels}
          labelRules={labelRules}
          onCreateLabel={handleCreateLabel}
          onDeleteLabel={handleDeleteLabel}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          onClose={() => setLabelModalOpen(false)}
        />
      )}
    </div>
  );
}
