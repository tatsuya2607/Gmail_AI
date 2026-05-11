import "./compose.css";
import { notFound } from "next/navigation";
import { getMessage } from "@/lib/google";
import db from "@/lib/db";
import { ComposeClient } from "./_components/ComposeClient";

interface Template {
  id: number;
  name: string;
  prompt: string;
}

interface Account {
  id: string;
  email: string;
  name: string | null;
}

export default async function ComposePage({
  params,
  searchParams,
}: {
  params: Promise<{ messageId: string }>;
  searchParams: Promise<{ accountId?: string }>;
}) {
  const { messageId } = await params;
  const { accountId } = await searchParams;

  if (!accountId) notFound();

  let message;
  try {
    message = await getMessage(accountId, messageId);
  } catch {
    notFound();
  }

  const templates = db
    .prepare("SELECT id, name, prompt FROM templates ORDER BY name ASC")
    .all() as Template[];

  const accounts = db
    .prepare("SELECT id, email, name FROM accounts ORDER BY email ASC")
    .all() as Account[];

  return (
    <ComposeClient
      message={message}
      templates={templates}
      accountId={accountId}
      accounts={accounts}
    />
  );
}
