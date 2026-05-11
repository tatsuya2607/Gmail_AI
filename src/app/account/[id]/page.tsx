import { notFound } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { listMessages, GmailMessage } from "@/lib/google";
import { AccountSwitcher } from "./_components/AccountSwitcher";

interface Account {
  id: string;
  email: string;
  name: string | null;
}

export default async function InboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accountId = decodeURIComponent(id);

  const accounts = db
    .prepare("SELECT id, email, name FROM accounts ORDER BY created_at ASC")
    .all() as Account[];

  const currentAccount = accounts.find((a) => a.id === accountId);
  if (!currentAccount) notFound();

  let messages: GmailMessage[] = [];
  let fetchError: string | null = null;

  try {
    messages = await listMessages(accountId);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "メールの取得に失敗しました";
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← ホーム
          </Link>
          <h1 className="text-xl font-semibold">受信トレイ</h1>
        </div>
        <AccountSwitcher accounts={accounts} currentId={accountId} />
      </div>

      {fetchError ? (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {fetchError}
        </div>
      ) : messages.length === 0 ? (
        <p className="text-center text-gray-500 py-16">メールがありません</p>
      ) : (
        <ul className="divide-y divide-gray-800 border border-gray-800 rounded-lg overflow-hidden">
          {messages.map((msg) => (
            <li key={msg.id}>
              <Link
                href={`/compose/${msg.id}?accountId=${encodeURIComponent(accountId)}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-900 transition-colors group"
              >
                <span className="w-44 shrink-0 truncate text-sm font-medium text-gray-300">
                  {parseSender(msg.from)}
                </span>

                <span className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="text-sm text-white font-medium truncate">
                    {msg.subject || "(件名なし)"}
                  </span>
                  <span className="text-sm text-gray-500 truncate hidden md:block">
                    — {msg.snippet}
                  </span>
                </span>

                <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                  {formatDate(msg.date)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function parseSender(from: string): string {
  // "Display Name <email>" → "Display Name"
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  // bare email or unknown format
  return from.replace(/<[^>]*>/, "").trim() || from;
}

function formatDate(dateStr: string): string {
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
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  }
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}
