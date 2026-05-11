import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { encrypt, decrypt } from "./crypto";
import db from "./db";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
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
}

export interface GmailMessageDetail extends GmailMessage {
  body: string;
  messageId: string; // Message-ID header value
  references: string;
}

export async function listMessages(accountId: string, maxResults = 20): Promise<GmailMessage[]> {
  const auth = await getAuthenticatedClient(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
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

      return {
        id: msg.data.id!,
        threadId: msg.data.threadId!,
        from: get("From"),
        subject: get("Subject"),
        date: get("Date"),
        snippet: msg.data.snippet ?? "",
      };
    })
  );

  return messages;
}

export async function getMessage(accountId: string, messageId: string): Promise<GmailMessageDetail> {
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

  const body = extractBody(msg.data.payload);

  return {
    id: msg.data.id!,
    threadId: msg.data.threadId!,
    from: get("From"),
    subject: get("Subject"),
    date: get("Date"),
    snippet: msg.data.snippet ?? "",
    body,
    messageId: get("Message-ID"),
    references: get("References"),
  };
}

function extractBody(payload: any): string {
  if (!payload) return "";

  if (payload.parts && payload.parts.length > 0) {
    // Prefer text/plain, fall back to text/html
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plain) return decodeGmailBase64(plain.body?.data ?? "");

    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html) return decodeGmailBase64(html.body?.data ?? "");

    // Recurse into nested multipart
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  if (payload.body?.data) {
    return decodeGmailBase64(payload.body.data);
  }

  return "";
}

function decodeGmailBase64(data: string): string {
  // Gmail uses URL-safe base64 (- and _), convert to standard
  const standard = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(standard, "base64").toString("utf8");
}

export interface SendOptions {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}

export async function sendMessage(accountId: string, opts: SendOptions): Promise<void> {
  const auth = await getAuthenticatedClient(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const subject = opts.subject.startsWith("Re: ") ? opts.subject : `Re: ${opts.subject}`;

  const lines = [
    `To: ${opts.to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
  ];
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
