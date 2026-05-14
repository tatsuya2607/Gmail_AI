import "./home.css";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { AppFooter } from "@/components/AppFooter";
import { HomeHeader } from "./_components/HomeHeader";
import { DeleteAccountButton } from "./_components/DeleteAccountButton";

interface Account {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
}

async function deleteAccount(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (id) db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
  redirect("/");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const accounts = db
    .prepare("SELECT id, email, name, created_at FROM accounts ORDER BY created_at ASC")
    .all() as Account[];

  return (
    <div className="home-page">

      <HomeHeader />

      {/* Main */}
      <div className="page-main">

        {/* Page header */}
        <div className="page-header">
          <div className="page-title">
            <h1>アカウント</h1>
            <span className="badge">{accounts.length} connected</span>
          </div>
          <div className="header-actions">
            <Link href="/templates" className="link-btn">テンプレート管理</Link>
            <a href="/api/auth/google" className="btn-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              アカウントを追加
            </a>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {error === "oauth_denied" && "Google 認証がキャンセルされました。"}
            {error === "no_email" && "メールアドレスを取得できませんでした。"}
            {error !== "oauth_denied" && error !== "no_email" && "エラーが発生しました。"}
          </div>
        )}

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-val">{accounts.length}</div>
            <div className="stat-label">連携アカウント</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">
              {(db.prepare("SELECT COUNT(*) as c FROM templates").get() as { c: number } | undefined)?.c ?? 0}
            </div>
            <div className="stat-label">テンプレート</div>
          </div>
        </div>

        {/* Account list */}
        {accounts.length === 0 ? (
          <div className="empty">
            <h2>アカウントが登録されていません</h2>
            <p>「アカウントを追加」から Gmail を連携してください</p>
          </div>
        ) : (
          <>
            <div className="section-label">連携済みアカウント</div>
            <ul className="account-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {accounts.map((account) => (
                <li key={account.id} className="account-card">
                  <span className="avatar">
                    {account.email.charAt(0).toUpperCase()}
                  </span>
                  <div className="acct-info">
                    <Link
                      href={`/account/${encodeURIComponent(account.id)}`}
                      className="acct-email"
                    >
                      {account.email}
                    </Link>
                    {account.name && <div className="acct-name">{account.name}</div>}
                    <div className="acct-meta">
                      追加日: {new Date(account.created_at).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <div className="acct-actions">
                    <span className="status-dot" title="接続済み" />
                    <Link
                      href={`/account/${encodeURIComponent(account.id)}`}
                      className="acct-link"
                    >
                      受信トレイ
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <DeleteAccountButton
                      email={account.email}
                      action={deleteAccount}
                      accountId={account.id}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <AppFooter right={`${accounts.length} accounts`} />

    </div>
  );
}
