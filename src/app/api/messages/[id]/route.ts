import { NextRequest, NextResponse } from "next/server";
import { getMessage } from "@/lib/google";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = req.nextUrl.searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    const message = await getMessage(accountId, id);
    return NextResponse.json(message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
