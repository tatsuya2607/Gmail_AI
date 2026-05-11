import Anthropic from "@anthropic-ai/sdk";

export type ClaudeModel = "haiku" | "sonnet";

const MODEL_IDS: Record<ClaudeModel, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
};

const SYSTEM_PROMPT = `あなたはユーザーのメール返信を代筆するアシスタントです。
以下を踏まえて自然で適切な返信本文を日本語で生成してください:
- 元メールの文脈と相手との関係性
- ユーザーからの指示(トーン・内容の方向性)
- 指定があればテンプレート

出力は本文のみ。署名・件名は含めない。
冒頭の挨拶と結びは自然に含めてよい。`;

export interface GenerateReplyOptions {
  from: string;
  subject: string;
  originalBody: string;
  userPrompt: string;
  templatePrompt?: string;
  model?: ClaudeModel;
}

export async function generateReply(opts: GenerateReplyOptions): Promise<string> {
  const client = new Anthropic();

  const sections = [
    `# 元メール`,
    `差出人: ${opts.from}`,
    `件名: ${opts.subject}`,
    `本文:\n${opts.originalBody}`,
    ``,
    `# 指示`,
    opts.userPrompt,
  ];

  if (opts.templatePrompt) {
    sections.push(``, `# テンプレート`, opts.templatePrompt);
  }

  const userMessage = sections.join("\n");
  const modelId = MODEL_IDS[opts.model ?? "haiku"];

  const response = await client.messages.create({
    model: modelId,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return block.text;
}
