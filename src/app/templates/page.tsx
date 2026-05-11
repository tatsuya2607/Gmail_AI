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
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← ホーム
        </Link>
        <h1 className="text-xl font-semibold">テンプレート管理</h1>
      </div>

      <TemplatesClient initial={templates} />
    </main>
  );
}
