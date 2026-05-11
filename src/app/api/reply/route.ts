import { NextRequest, NextResponse } from "next/server";
import { getMessage } from "@/lib/google";
import { generateReply, ClaudeModel } from "@/lib/claude";
import db from "@/lib/db";

interface Template {
  id: number;
  prompt: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messageId, accountId, userPrompt, templateId, model } = body;

  if (!messageId || !accountId || !userPrompt) {
    return NextResponse.json(
      { error: "messageId, accountId, userPrompt are required" },
      { status: 400 }
    );
  }

  try {
    const message = await getMessage(accountId, messageId);

    let templatePrompt: string | undefined;
    if (templateId) {
      const tpl = db
        .prepare("SELECT id, prompt FROM templates WHERE id = ?")
        .get(templateId) as Template | undefined;
      if (tpl) templatePrompt = tpl.prompt;
    }

    const reply = await generateReply({
      from: message.from,
      subject: message.subject,
      originalBody: message.body,
      userPrompt,
      templatePrompt,
      model: model as ClaudeModel | undefined,
    });

    return NextResponse.json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate reply";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
