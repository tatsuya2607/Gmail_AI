import "./inbox.css";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { listMessages, GmailMessage } from "@/lib/google";
import { InboxClient } from "./_components/InboxClient";

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
    <InboxClient
      messages={messages}
      accounts={accounts}
      currentAccount={currentAccount}
      accountId={accountId}
      fetchError={fetchError}
    />
  );
}
