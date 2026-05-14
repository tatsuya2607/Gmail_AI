"use client";

import { useRef } from "react";
import type { GmailMessageDetail } from "@/lib/google";

interface Account {
  id: string;
  email: string;
  name: string | null;
}

interface Props {
  message: GmailMessageDetail;
  currentAccount: Account | undefined;
  accountId: string;
  style?: React.CSSProperties;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("ja-JP", {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseSenderName(from: string): string {
  const m = from.match(/^"?([^"<]+)"?\s*</);
  return m ? m[1].trim() : from;
}

function getSenderInitials(from: string): string {
  const name = parseSenderName(from);
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function SourcePane({ message, currentAccount, accountId, style }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toHeader = (() => {
    const m = message.from.match(/<([^>]+)>/);
    return m ? m[1] : message.from;
  })();

  function onIframeLoad() {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    const h = iframe.contentDocument.body.scrollHeight;
    iframe.style.height = `${h + 24}px`;
  }

  return (
    <div className="pane" style={style}>
      <div className="src">
        <dl className="src-meta">
          <dt className="k">from</dt>
          <dd className="v">
            <div className="from">
              <span className="avatar">{getSenderInitials(message.from)}</span>
              <span className="name">{parseSenderName(message.from)}</span>
            </div>
          </dd>
          <dt className="k">addr</dt>
          <dd className="v mono">{toHeader}</dd>
          <dt className="k">to</dt>
          <dd className="v mono">{currentAccount?.email ?? accountId}</dd>
          <dt className="k">date</dt>
          <dd className="v mono">{formatDate(message.date)}</dd>
        </dl>
        <div className="src-subject">{message.subject || "(件名なし)"}</div>
        {message.htmlBody ? (
          <iframe
            ref={iframeRef}
            className="src-body-iframe"
            srcDoc={message.htmlBody}
            sandbox="allow-popups allow-same-origin"
            title="email-content"
            onLoad={onIframeLoad}
          />
        ) : (
          <pre className="src-body">{message.body || message.snippet || "(本文なし)"}</pre>
        )}
      </div>
    </div>
  );
}
