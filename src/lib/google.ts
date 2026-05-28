import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { encrypt, decrypt } from "./crypto";
import db from "./db";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

export function getAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export interface AccountRow {
  id: string;
  email: string;
  name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: number;
}

export async function getAuthenticatedClient(accountId: string): Promise<OAuth2Client> {
  const row = db
    .prepare("SELECT * FROM accounts WHERE id = ?")
    .get(accountId) as AccountRow | undefined;

  if (!row) throw new Error(`Account not found: ${accountId}`);

  const client = createOAuthClient();
  client.setCredentials({
    access_token: decrypt(row.access_token),
    refresh_token: decrypt(row.refresh_token),
    expiry_date: row.expires_at,
  });

  // Auto-refresh: persist new tokens back to DB
  client.on("tokens", (tokens) => {
    if (tokens.access_token) {
      db.prepare(
        "UPDATE accounts SET access_token = ?, expires_at = ? WHERE id = ?"
      ).run(
        encrypt(tokens.access_token),
        tokens.expiry_date ?? Date.now() + 3600 * 1000,
        accountId
      );
    }
  });

  // Proactively refresh if expired
  if (row.expires_at < Date.now() + 60_000) {
    await client.refreshAccessToken();
  }

  return client;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
}

export interface GmailMessageDetail extends GmailMessage {
  body: string;       // plain text — used by AI
  htmlBody?: string;  // raw HTML — used for display
  messageId: string;  // Message-ID header value
  references: string;
}

// ── キャッシュ TTL: 3分 ──
const LIST_CACHE_TTL = 3 * 60 * 1000;

type ListCacheRow = {
  messages_json: string;
  next_page_token: string | null;
  fetched_at: number;
};

function applyLocalOverrides(messages: GmailMessage[], accountId: string): GmailMessage[] {
  const starStmt = db.prepare(
    "SELECT is_starred FROM starred_messages WHERE message_id = ? AND account_id = ?"
  );
  const readStmt = db.prepare(
    "SELECT 1 FROM read_messages WHERE message_id = ? AND account_id = ?"
  );
  return messages.map((m) => {
    const starRow = starStmt.get(m.id, accountId) as { is_starred: number } | undefined;
    const readRow = m.isUnread ? readStmt.get(m.id, accountId) : null;
    return {
      ...m,
      isStarred: starRow !== undefined ? !!starRow.is_starred : m.isStarred,
      isUnread: m.isUnread && !readRow,
    };
  });
}

export async function listMessages(
  accountId: string,
  maxResults = 50,
  pageToken?: string,
  opts: { forceRefresh?: boolean } = {}
): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
  const pageKey = pageToken ?? "";
  const now = Date.now();

  // キャッシュから返す
  if (!opts.forceRefresh) {
    const cached = db.prepare(
      "SELECT messages_json, next_page_token, fetched_at FROM message_list_cache WHERE account_id = ? AND page_key = ?"
    ).get(accountId, pageKey) as ListCacheRow | undefined;

    if (cached && now - cached.fetched_at < LIST_CACHE_TTL) {
      const base = JSON.parse(cached.messages_json) as GmailMessage[];
      return {
        messages: applyLocalOverrides(base, accountId),
        nextPageToken: cached.next_page_token ?? undefined,
      };
    }
  }

  // Gmail API からフェッチ
  const auth = await getAuthenticatedClient(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
    pageToken,
  });

  const items = listRes.data.messages ?? [];

  const messages = await Promise.all(
    items.map(async (item) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: item.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = msg.data.payload?.headers ?? [];
      const get = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

      const gmailUnread = msg.data.labelIds?.includes("UNREAD") ?? false;
      const localRead = gmailUnread
        ? db.prepare("SELECT 1 FROM read_messages WHERE message_id = ? AND account_id = ?")
            .get(msg.data.id!, accountId) as unknown
        : null;

      const gmailStarred = msg.data.labelIds?.includes("STARRED") ?? false;
      const localStarRow = db
        .prepare("SELECT is_starred FROM starred_messages WHERE message_id = ? AND account_id = ?")
        .get(msg.data.id!, accountId) as { is_starred: number } | undefined;
      const isStarred = localStarRow !== undefined ? !!localStarRow.is_starred : gmailStarred;

      return {
        id: msg.data.id!,
        threadId: msg.data.threadId!,
        from: get("From"),
        subject: get("Subject"),
        date: get("Date"),
        snippet: msg.data.snippet ?? "",
        isUnread: gmailUnread && !localRead,
        isStarred,
      };
    })
  );

  const nextPageToken = listRes.data.nextPageToken ?? undefined;

  // キャッシュに保存
  db.prepare(
    "INSERT OR REPLACE INTO message_list_cache (account_id, page_key, messages_json, next_page_token, fetched_at) VALUES (?, ?, ?, ?, ?)"
  ).run(accountId, pageKey, JSON.stringify(messages), nextPageToken ?? null, now);

  return { messages, nextPageToken };
}

export async function getMessage(accountId: string, messageId: string): Promise<GmailMessageDetail> {
  // メール本文はキャッシュから即返す（内容は変わらないため TTL なし）
  const cached = db.prepare(
    "SELECT detail_json FROM message_detail_cache WHERE message_id = ? AND account_id = ?"
  ).get(messageId, accountId) as { detail_json: string } | undefined;
  if (cached) return JSON.parse(cached.detail_json) as GmailMessageDetail;

  const auth = await getAuthenticatedClient(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = msg.data.payload?.headers ?? [];
  const get = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

  const { text: body, html: htmlBody } = extractBodies(msg.data.payload);

  const detail: GmailMessageDetail = {
    id: msg.data.id!,
    threadId: msg.data.threadId!,
    from: get("From"),
    subject: get("Subject"),
    date: get("Date"),
    snippet: msg.data.snippet ?? "",
    isUnread: msg.data.labelIds?.includes("UNREAD") ?? false,
    isStarred: msg.data.labelIds?.includes("STARRED") ?? false,
    body,
    htmlBody,
    messageId: get("Message-ID"),
    references: get("References"),
  };

  // キャッシュに保存
  db.prepare(
    "INSERT OR REPLACE INTO message_detail_cache (message_id, account_id, detail_json, fetched_at) VALUES (?, ?, ?, ?)"
  ).run(messageId, accountId, JSON.stringify(detail), Date.now());

  return detail;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|tr|blockquote|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractBodies(payload: gmail_v1.Schema$MessagePart | null | undefined): { text: string; html?: string } {
  if (!payload) return { text: "" };

  if (payload.parts && payload.parts.length > 0) {
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    const rawHtml = htmlPart ? decodeGmailBase64(htmlPart.body?.data ?? "") : undefined;

    if (plain) return { text: decodeGmailBase64(plain.body?.data ?? ""), html: rawHtml };
    if (rawHtml) return { text: htmlToText(rawHtml), html: rawHtml };

    for (const part of payload.parts) {
      const result = extractBodies(part);
      if (result.text) return result;
    }
  }

  if (payload.body?.data) {
    const decoded = decodeGmailBase64(payload.body.data);
    if (payload.mimeType === "text/html") return { text: htmlToText(decoded), html: decoded };
    return { text: decoded };
  }

  return { text: "" };
}

function decodeGmailBase64(data: string): string {
  // Gmail uses URL-safe base64 (- and _), convert to standard
  const standard = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(standard, "base64").toString("utf8");
}

export interface SendOptions {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}

export async function trashMessage(accountId: string, messageId: string): Promise<void> {
  const auth = await getAuthenticatedClient(accountId);
  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.messages.trash({ userId: "me", id: messageId });
}

export async function markAsRead(accountId: string, messageId: string): Promise<void> {
  const auth = await getAuthenticatedClient(accountId);
  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
}

export async function sendMessage(accountId: string, opts: SendOptions): Promise<void> {
  const auth = await getAuthenticatedClient(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const subject = opts.inReplyTo
    ? (opts.subject.startsWith("Re:") ? opts.subject : `Re: ${opts.subject}`)
    : opts.subject;

  const lines = [
    `To: ${opts.to}`,
  ];
  if (opts.cc) lines.push(`Cc: ${opts.cc}`);
  if (opts.bcc) lines.push(`Bcc: ${opts.bcc}`);
  lines.push(
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
  );
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push("", opts.body);

  const raw = Buffer.from(lines.join("\r\n")).toString("base64url");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      ...(opts.threadId ? { threadId: opts.threadId } : {}),
    },
  });
}
