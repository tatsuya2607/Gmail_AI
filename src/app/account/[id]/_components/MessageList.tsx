import type React from "react";
import type { GmailMessage } from "@/lib/google";
import { Icon } from "./Icon";
import { EmailRow } from "./EmailRow";
import type { Label } from "./types";

interface Props {
  view: "inbox" | "starred" | "trash";
  currentAccountEmail: string;
  accountId: string;
  displayMessages: GmailMessage[];
  fetchError: string | null;
  nextToken: string | undefined;
  loadingMore: boolean;
  allMessagesCount: number;
  onLoadMore: () => void;
  readFilter: "all" | "unread";
  setReadFilter: (v: "all" | "unread") => void;
  viewFilteredCount: number;
  viewUnreadCount: number;
  trashFilteredCount: number;
  unreadCount: number;
  filteredCount: number;
  selectedIds: Set<string>;
  allInViewSelected: boolean;
  someSelected: boolean;
  onSelectAll: () => void;
  onCancelSelect: () => void;
  query: string;
  setQuery: (v: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  activeLabel: number | null;
  labels: Label[];
  onClearLabel: () => void;
  loadingId: string | null;
  localStars: Record<string, boolean>;
  messageLabelMap: Map<string, Label[]>;
  onNavigate: (id: string) => void;
  onStar: (id: string, starred: boolean) => void;
  onToggleSelect: (id: string) => void;
  onTrashSelected: () => void;
  onRestoreSelected: () => void;
  onPermanentDelete: () => void;
}

export function MessageList({
  view, currentAccountEmail, accountId,
  displayMessages, fetchError, nextToken, loadingMore, allMessagesCount, onLoadMore,
  readFilter, setReadFilter, viewFilteredCount, viewUnreadCount, trashFilteredCount,
  unreadCount, filteredCount,
  selectedIds, allInViewSelected, someSelected, onSelectAll, onCancelSelect,
  query, setQuery, searchRef,
  activeLabel, labels, onClearLabel,
  loadingId, localStars, messageLabelMap,
  onNavigate, onStar, onToggleSelect,
  onTrashSelected, onRestoreSelected, onPermanentDelete,
}: Props) {
  return (
    <div className="pane">
      {/* ── ペインヘッダー ── */}
      <div className={"pane-head" + (view === "trash" ? " trash-head" : "")}>
        <span className="label">
          {view === "trash"
            ? <>ゴミ箱 <b>/ {currentAccountEmail}</b></>
            : <>inbox <b>/ {currentAccountEmail}</b></>
          }
        </span>
        <div className="right">
          {view === "trash" ? (
            <span className="tag zinc">{trashFilteredCount}件</span>
          ) : (
            <>
              <span className="tag amber">未読 {unreadCount}件</span>
              <span className="tag zinc">
                表示 {filteredCount} / 読込 {allMessagesCount}{nextToken ? "+" : ""}件
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── リストツールバー ── */}
      <div className={"list-toolbar" + (selectedIds.size > 0 ? " selecting" : "")}>
        <span
          role="button"
          className={
            "select-all-box" +
            (allInViewSelected ? " checked" : someSelected ? " indeterminate" : "")
          }
          onClick={onSelectAll}
          title={allInViewSelected ? "全選択解除" : "全選択"}
        >
          {allInViewSelected && (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {someSelected && !allInViewSelected && <span className="select-all-dash" />}
        </span>

        {selectedIds.size > 0 ? (
          <>
            <span className="sel-count">{selectedIds.size}件選択中</span>
            <button className="sel-cancel" onClick={onCancelSelect}>キャンセル</button>
            {view === "trash" ? (
              <>
                <button className="sel-restore" onClick={onRestoreSelected}>
                  <Icon name="refresh" size={13} />元に戻す
                </button>
                <button className="sel-delete" onClick={onPermanentDelete}>
                  <Icon name="trash" size={13} />完全削除
                </button>
              </>
            ) : (
              <button className="sel-delete" onClick={onTrashSelected}>
                <Icon name="trash" size={13} />ゴミ箱へ移動
              </button>
            )}
          </>
        ) : (
          <>
            <button className={"fchip" + (readFilter === "all" ? " on" : "")} onClick={() => setReadFilter("all")}>
              すべて <span className="num">{viewFilteredCount}</span>
            </button>
            <button className={"fchip" + (readFilter === "unread" ? " on" : "")} onClick={() => setReadFilter("unread")}>
              未読 <span className="num">{viewUnreadCount}</span>
            </button>
            {activeLabel !== null && (
              <span className="active-label-chip">
                <span className="label-chip-dot" style={{ background: labels.find((l) => l.id === activeLabel)?.color }} />
                {labels.find((l) => l.id === activeLabel)?.name}
                <span role="button" style={{ marginLeft: 4, cursor: "pointer", opacity: 0.6 }} onClick={onClearLabel}>✕</span>
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

      {/* ── メールリスト ── */}
      {fetchError ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--danger)", fontFamily: "var(--mono)", fontSize: 12 }}>
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
              onNavigate={view === "trash" ? () => {} : onNavigate}
              isStarred={m.id in localStars ? localStars[m.id] : m.isStarred}
              onStar={onStar}
              onToggleSelect={onToggleSelect}
              isSelected={selectedIds.has(m.id)}
              msgLabels={messageLabelMap.get(m.id) ?? []}
            />
          ))}

          {displayMessages.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--fg-faint)", fontFamily: "var(--mono)", fontSize: 12 }}>
              {view === "trash" ? "ゴミ箱は空です" : "該当するメッセージはありません"}
            </div>
          )}

          {nextToken && view !== "trash" && (
            <div className="load-more-wrap">
              <button className="load-more-btn" disabled={loadingMore} onClick={onLoadMore}>
                {loadingMore ? "読み込み中…" : `もっと読み込む · ${allMessagesCount}件表示中`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
