"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Account {
  id: string;
  email: string;
  name: string | null;
}

export interface Crumb {
  icon?: string;
  label?: string;
  href?: string;
  active?: boolean;
}

interface Props {
  accountId: string;
  accounts: Account[];
  crumbs: Crumb[];
  tools?: React.ReactNode;
}

// ── Toolbar専用の最小限アイコン ──
function TbIcon({ name, size = 13 }: { name: string; size?: number }) {
  const p: React.SVGProps<SVGSVGElement> = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "home":     return <svg {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>;
    case "inbox":    return <svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
    case "sparkle":  return <svg {...p}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m5.6 18.4 2.8-2.8"/><path d="m15.6 8.4 2.8-2.8"/></svg>;
    case "template": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
    case "chev":     return <svg {...p}><path d="m6 9 6 6 6-6"/></svg>;
    case "check":    return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    default:         return null;
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const GRADIENTS = [
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #6366f1, #4338ca)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #ef4444, #b91c1c)",
  "linear-gradient(135deg, #a78bfa, #7c3aed)",
  "linear-gradient(135deg, #06b6d4, #0e7490)",
  "linear-gradient(135deg, #ec4899, #be185d)",
  "linear-gradient(135deg, #84cc16, #4d7c0f)",
];

function acctGradient(seed: string): string {
  return GRADIENTS[hashStr(seed) % GRADIENTS.length];
}

function acctInitials(a: Account): string {
  const name = a.name ?? a.email.split("@")[0];
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PageToolbar({ accountId, accounts, crumbs, tools }: Props) {
  const router = useRouter();
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctRect, setAcctRect] = useState<DOMRect | null>(null);

  const currentAccount = accounts.find((a) => a.id === accountId);

  return (
    <div className="toolbar">
      {/* ── パンくず ── */}
      <nav className="crumbs">
        {crumbs.map((crumb, i) => {
          const inner = (
            <>
              {crumb.icon && <TbIcon name={crumb.icon} size={crumb.label ? 12 : 13} />}
              {crumb.label && <span>{crumb.label}</span>}
            </>
          );
          if (crumb.active) return <span key={i} className="seg active">{inner}</span>;
          if (crumb.href) return <Link key={i} href={crumb.href} className="seg">{inner}</Link>;
          return <span key={i} className="seg">{inner}</span>;
        })}
      </nav>

      {/* ── アカウント切替 ── */}
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
            background: acctGradient((currentAccount?.id ?? "") + (currentAccount?.email ?? "")),
            width: 18, height: 18, fontSize: "10px",
          }}
        >
          {currentAccount ? acctInitials(currentAccount) : accountId.charAt(0).toUpperCase()}
        </span>
        <span className="mail">{currentAccount?.email ?? accountId}</span>
        <TbIcon name="chev" size={11} />
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
                  style={{ background: acctGradient(a.id + a.email), width: 22, height: 22, fontSize: "10px" }}
                >
                  {acctInitials(a)}
                </span>
                <div className="info">
                  <span className="name">{a.name ?? a.email.split("@")[0]}</span>
                  <span className="mail">{a.email}</span>
                </div>
                {a.id === accountId && <TbIcon name="check" size={13} />}
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

      {/* ── 右側ツール（各ページが渡す） ── */}
      {tools && <div className="tools-right">{tools}</div>}
    </div>
  );
}
