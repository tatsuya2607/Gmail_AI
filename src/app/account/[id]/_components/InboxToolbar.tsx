"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { getInitials, getGradient } from "./utils";
import type { Account } from "./types";

interface Props {
  accounts: Account[];
  currentAccount: Account;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export function InboxToolbar({
  accounts, currentAccount,
  isRefreshing, onRefresh, onOpenSettings,
}: Props) {
  const router = useRouter();
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctRect, setAcctRect] = useState<DOMRect | null>(null);

  function acctInitials(a: Account): string {
    return getInitials(a.name ?? a.email.split("@")[0]);
  }

  function acctGradient(a: Account): string {
    return getGradient(a.id + a.email);
  }

  return (
    <div className="toolbar">
      <div className="crumbs">
        <Link href="/" className="seg"><Icon name="home" size={13} /></Link>
        <span className="seg active"><Icon name="inbox" size={12} /> Inbox</span>
        <Link href="/templates" className="seg"><Icon name="template" size={13} /> Templates</Link>
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
          style={{ background: acctGradient(currentAccount), width: 18, height: 18, fontSize: "10px" }}
        >
          {acctInitials(currentAccount)}
        </span>
        <span className="mail">{currentAccount.email}</span>
        <Icon name="chev" size={11} className="caret" />
      </button>

      {acctOpen && acctRect && (
        <>
          <div onClick={() => setAcctOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
          <div className="dropdown acct-dd" style={{ top: acctRect.bottom + 6, left: acctRect.left }}>
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
                  style={{ background: acctGradient(a), width: 22, height: 22, fontSize: "10px" }}
                >
                  {acctInitials(a)}
                </span>
                <div className="info">
                  <span className="name">{a.name ?? a.email.split("@")[0]}</span>
                  <span className="mail">{a.email}</span>
                </div>
                {a.id === currentAccount.id && <Icon name="check" size={13} className="check" />}
              </div>
            ))}
            <div className="sep" />
            <Link
              href="/api/auth/google"
              className="opt"
              onClick={() => setAcctOpen(false)}
              style={{ color: "var(--fg-dim)" }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 4,
                border: "1px dashed var(--line-2)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>+</span>
              <div className="info"><span className="name">アカウントを追加</span></div>
            </Link>
          </div>
        </>
      )}

      <div className="tools-right">
        <button className="icon-btn" title="更新" onClick={onRefresh} disabled={isRefreshing}>
          <Icon name="refresh" className={isRefreshing ? "spin" : ""} />
        </button>
        <button className="icon-btn" title="設定" onClick={onOpenSettings}>
          <Icon name="settings" />
        </button>
      </div>
    </div>
  );
}
