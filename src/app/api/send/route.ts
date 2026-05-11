import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/google";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accountId, to, subject, replyBody, inReplyTo, references, threadId } = body;

  if (!accountId || !to || !subject || !replyBody) {
    return NextResponse.json(
      { error: "accountId, to, subject, replyBody are required" },
      { status: 400 }
    );
  }

  try {
    await sendMessage(accountId, {
      to,
      subject,
      body: replyBody,
      inReplyTo,
      references,
      threadId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
