import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
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
  if (id) {
    db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
  }
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
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gmail AI Reply</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            テンプレート
          </Link>
          <a
            href="/api/auth/google"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + アカウントを追加
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {error === "oauth_denied" && "Google 認証がキャンセルされました。"}
          {error === "no_email" && "メールアドレスを取得できませんでした。"}
          {error !== "oauth_denied" && error !== "no_email" && "エラーが発生しました。"}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">アカウントが登録されていません</p>
          <p className="text-sm">「アカウントを追加」から Gmail を連携してください</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/account/${encodeURIComponent(account.id)}`}
                  className="font-medium text-blue-400 hover:text-blue-300 truncate block"
                >
                  {account.email}
                </Link>
                {account.name && (
                  <p className="text-sm text-gray-400 mt-0.5">{account.name}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  追加日: {new Date(account.created_at).toLocaleDateString("ja-JP")}
                </p>
              </div>

              <div className="flex items-center gap-4 ml-4 shrink-0">
                <Link
                  href={`/account/${encodeURIComponent(account.id)}`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  受信トレイ →
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
      )}
    </main>
  );
}
