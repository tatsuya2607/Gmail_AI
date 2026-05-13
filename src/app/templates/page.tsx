import "./templates.css";
import Link from "next/link";
import db from "@/lib/db";
import { TemplatesClient } from "./_components/TemplatesClient";

interface Template {
  id: number;
  name: string;
  prompt: string;
  updated_at: number;
}

export default function TemplatesPage() {
  const templates = db
    .prepare("SELECT * FROM templates ORDER BY name ASC")
    .all() as Template[];

  return (
    <div className="templates-page">

      {/* Titlebar */}
      <div className="titlebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          Gmail AI Reply
        </div>
        <span className="tb-path">/templates</span>
        <div className="tb-right">
          <span><span className="kbd">⌘K</span> コマンド</span>
        </div>
      </div>

      {/* Toolbar / Breadcrumbs */}
      <div className="toolbar">
        <nav className="crumbs">
          <Link href="/" className="seg">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            ホーム
          </Link>
          <span className="sep">/</span>
          <span className="seg active">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M9 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            テンプレート
          </span>
        </nav>
      </div>

      {/* Main */}
      <div className="page-main">
        <TemplatesClient initial={templates} />
      </div>

      {/* Status bar */}
      <div className="statusbar">
        <div className="sb-item"><span className="dot" />接続済み</div>
        <div className="sb-item">{templates.length} templates</div>
        <div className="sb-right">Gmail AI Reply</div>
      </div>

    </div>
  );
}
