import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createOAuthClient } from "@/lib/google";
import { encrypt } from "@/lib/crypto";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=oauth_denied", req.url));
  }

  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  if (!userInfo.email) {
    return NextResponse.redirect(new URL("/?error=no_email", req.url));
  }

  const now = Date.now();
  db.prepare(`
    INSERT INTO accounts (id, email, name, access_token, refresh_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at
  `).run(
    userInfo.email,
    userInfo.email,
    userInfo.name ?? null,
    encrypt(tokens.access_token!),
    encrypt(tokens.refresh_token!),
    tokens.expiry_date ?? now + 3600 * 1000,
    now
  );

  return NextResponse.redirect(new URL("/", req.url));
}
