import "./inbox.css";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { listMessages, GmailMessage } from "@/lib/google";
import { InboxClient } from "./_components/InboxClient";

interface LocalTrashRow {
  message_id: string;
  account_id: string;
  message_json: string;
}

interface Account {
  id: string;
  email: string;
  name: string | null;
}

interface Label {
  id: number;
  account_id: string;
  name: string;
  color: string;
  created_at: number;
}

interface LabelRule {
  id: number;
  label_id: number;
  pattern: string;
  created_at: number;
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

  const labels = db
    .prepare("SELECT * FROM labels WHERE account_id = ? ORDER BY created_at ASC")
    .all(accountId) as Label[];

  const labelRules = db
    .prepare(
      "SELECT * FROM label_rules WHERE label_id IN (SELECT id FROM labels WHERE account_id = ?) ORDER BY created_at ASC"
    )
    .all(accountId) as LabelRule[];

  const localTrashRows = db
    .prepare("SELECT * FROM local_trash WHERE account_id = ? ORDER BY trashed_at DESC")
    .all(accountId) as LocalTrashRow[];
  const initialTrashedMessages = localTrashRows.map((r) => JSON.parse(r.message_json)) as GmailMessage[];
  const localTrashIds = new Set(localTrashRows.map((r) => r.message_id));

  let messages: GmailMessage[] = [];
  let initialNextPageToken: string | undefined;
  let fetchError: string | null = null;

  try {
    const result = await listMessages(accountId, 50);
    messages = result.messages.filter((m) => !localTrashIds.has(m.id));
    initialNextPageToken = result.nextPageToken;
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
      initialNextPageToken={initialNextPageToken}
      labels={labels}
      labelRules={labelRules}
      initialTrashedMessages={initialTrashedMessages}
    />
  );
}
