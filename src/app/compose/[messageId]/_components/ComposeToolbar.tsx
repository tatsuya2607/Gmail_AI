"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./Icon";

interface Account {
  id: string;
  email: string;
  name: string | null;
}

interface Props {
  accountId: string;
  accounts: Account[];
  onOpenSettings: () => void;
}

export function ComposeToolbar({ accountId, accounts, onOpenSettings }: Props) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const currentAccount = accounts.find((a) => a.id === accountId);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.closest(".acct-scope")?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className="toolbar">
      <nav className="crumbs">
        <Link href="/" className="seg"><Icon name="home" size={13} /></Link>
        <Link href={`/account/${encodeURIComponent(accountId)}`} className="seg"><Icon name="inbox" size={13} /></Link>
        <span className="seg active">
          <Icon name="sparkle" size={12} />Reply Composer
        </span>
        <Link href="/templates" className="seg"><Icon name="template" size={13} /></Link>
      </nav>

      <div className="acct-scope" style={{ position: "relative" }}>
        <button ref={btnRef} className="acct" onClick={() => setShowDropdown((v) => !v)}>
          <span className="avatar">
            {(currentAccount?.email ?? accountId).charAt(0).toUpperCase()}
          </span>
          <span className="acct-mail">{currentAccount?.email ?? accountId}</span>
          <span className="caret"><Icon name="chev" size={12} /></span>
        </button>
        {showDropdown && (
          <div className="dropdown" style={{ top: "calc(100% + 4px)", left: 0, position: "absolute" }}>
            <div className="dd-grp">アカウント</div>
            {accounts.map((a) => (
              <div
                key={a.id}
                className="dd-opt"
                onClick={() => {
                  setShowDropdown(false);
                  if (a.id !== accountId) router.push(`/account/${encodeURIComponent(a.id)}`);
                }}
              >
                <span className="avatar">{a.email.charAt(0).toUpperCase()}</span>
                <div className="dd-info">
                  <span className="dd-name">{a.name ?? a.email}</span>
                  <span className="dd-mail">{a.email}</span>
                </div>
                {a.id === accountId && (
                  <span className="dd-check"><Icon name="check" size={14} /></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tools-right">
        <Link href="/templates" className="icon-btn" title="テンプレート管理">
          <Icon name="template" size={14} />
        </Link>
        <button className="icon-btn" title="設定" onClick={onOpenSettings}>
          <Icon name="settings" size={14} />
        </button>
      </div>
    </div>
  );
}
