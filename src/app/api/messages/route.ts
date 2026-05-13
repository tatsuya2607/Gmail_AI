import { NextRequest, NextResponse } from "next/server";
import { listMessages } from "@/lib/google";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const pageToken = req.nextUrl.searchParams.get("pageToken") ?? undefined;

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    const result = await listMessages(accountId, 50, pageToken);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
