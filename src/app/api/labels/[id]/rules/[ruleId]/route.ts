import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  const { ruleId } = await params;
  db.prepare("DELETE FROM label_rules WHERE id = ?").run(parseInt(ruleId));
  return NextResponse.json({ ok: true });
}
