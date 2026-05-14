import "./templates.css";
import db from "@/lib/db";
import { AppFooter } from "@/components/AppFooter";
import { TemplatesClient } from "./_components/TemplatesClient";

interface Template {
  id: number;
  name: string;
  prompt: string;
  updated_at: number;
}

interface Account {
  id: string;
  email: string;
  name: string | null;
}

export default function TemplatesPage() {
  const templates = db
    .prepare("SELECT * FROM templates ORDER BY name ASC")
    .all() as Template[];

  const accounts = db
    .prepare("SELECT id, email, name FROM accounts ORDER BY created_at ASC")
    .all() as Account[];

  return (
    <div className="templates-page">
      <TemplatesClient
        initial={templates}
        accounts={accounts}
        accountId={accounts[0]?.id ?? ""}
      />
      <AppFooter right={`${templates.length} templates`} />
    </div>
  );
}
