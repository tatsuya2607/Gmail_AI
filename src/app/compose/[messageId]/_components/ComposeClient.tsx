"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GmailMessageDetail } from "@/lib/google";
import { AppTitlebar } from "@/components/AppTitlebar";
import { AppStatusbar } from "@/components/AppStatusbar";
import { PageToolbar } from "@/components/PageToolbar";
import { Icon } from "./Icon";
import { SourcePane } from "./SourcePane";
import { GeneratePane } from "./GeneratePane";
import { SettingsModal } from "./SettingsModal";
import { Toast } from "./Toast";

interface Template {
  id: number;
  name: string;
  prompt: string;
}

interface Account {
  id: string;
  email: string;
  name: string | null;
}

type Phase = "idle" | "thinking" | "streaming" | "editable";

interface Props {
  message: GmailMessageDetail;
  templates: Template[];
  accountId: string;
  accounts: Account[];
}

export function ComposeClient({ message, templates, accountId, accounts }: Props) {
  const router = useRouter();

  const [userPrompt, setUserPrompt] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [model, setModel] = useState<"haiku" | "sonnet">("haiku");
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayedReply, setDisplayedReply] = useState("");
  const [isEdited, setIsEdited] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [subjectLine, setSubjectLine] = useState(() => {
    const s = message.subject || "";
    return s.startsWith("Re:") ? s : `Re: ${s}`;
  });
  const [leftPct, setLeftPct] = useState(40);

  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentAccount = accounts.find((a) => a.id === accountId);

  const toHeader = (() => {
    const m = message.from.match(/<([^>]+)>/);
    return m ? m[1] : message.from;
  })();

  useEffect(() => {
    return () => { if (streamTimerRef.current) clearInterval(streamTimerRef.current); };
  }, []);

  useEffect(() => {
    if (message.isUnread) {
      fetch(`/api/messages/${message.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null;
      setTheme(saved ?? "system");
    } catch {}
  }, []);

  function applyTheme(t: "system" | "light" | "dark") {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
      } else {
        localStorage.setItem("theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - left) / width) * 100;
      setLeftPct(Math.min(75, Math.max(20, pct)));
    };

    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const startStreaming = useCallback((text: string) => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setPhase("streaming");
    setDisplayedReply("");
    let i = 0;
    const chunkSize = Math.max(1, Math.ceil(text.length / 100));
    streamTimerRef.current = setInterval(() => {
      i += chunkSize;
      if (i >= text.length) {
        clearInterval(streamTimerRef.current!);
        setDisplayedReply(text);
        setPhase("editable");
      } else {
        setDisplayedReply(text.slice(0, i));
      }
    }, 18);
  }, []);

  async function handleGenerate() {
    if (!userPrompt.trim() || phase === "thinking" || phase === "streaming") return;
    setPhase("thinking");
    setGenerateError(null);
    setIsEdited(false);
    setDisplayedReply("");

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, accountId, userPrompt, templateId: templateId ?? undefined, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      startStreaming(data.reply);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "生成に失敗しました");
      setPhase("idle");
    }
  }

  async function handleSend() {
    if (!displayedReply.trim()) return;
    setSendError(null);
    const refs = [message.references, message.messageId].filter(Boolean).join(" ").trim();

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId, to: toHeader, subject: subjectLine,
          replyBody: displayedReply,
          inReplyTo: message.messageId || undefined,
          references: refs || undefined,
          threadId: message.threadId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToastVisible(true);
      setTimeout(() => {
        setToastExiting(true);
        setTimeout(() => {
          setToastVisible(false);
          setToastExiting(false);
          router.push(`/account/${encodeURIComponent(accountId)}`);
        }, 220);
      }, 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "送信に失敗しました");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  }

  const canGenerate = userPrompt.trim().length > 0 && phase !== "thinking" && phase !== "streaming";
  const canSend = (phase === "editable" || phase === "streaming") && displayedReply.trim().length > 0;

  return (
    <div className="compose-page">
      <AppTitlebar
        pathSegments={[
          { label: "inbox" },
          { label: message.id.slice(0, 10) },
          { label: "reply", dim: true },
        ]}
      />

      <PageToolbar
        accountId={accountId}
        accounts={accounts}
        crumbs={[
          { icon: "home", href: "/" },
          { icon: "inbox", href: `/account/${encodeURIComponent(accountId)}` },
          { icon: "template", href: "/templates" },
        ]}
        tools={
          <>
            <a href="/templates" className="icon-btn" title="テンプレート管理">
              <Icon name="template" size={14} />
            </a>
            <button className="icon-btn" title="設定" onClick={() => setSettingsOpen(true)}>
              <Icon name="settings" size={14} />
            </button>
          </>
        }
      />

      <div className="main" ref={containerRef}>
        <SourcePane
          message={message}
          currentAccount={currentAccount}
          accountId={accountId}
          style={{ width: `${leftPct}%` }}
        />
        <div className="resize-handle" onMouseDown={startResize} />
        <GeneratePane
          model={model}
          onModelChange={setModel}
          phase={phase}
          userPrompt={userPrompt}
          setUserPrompt={setUserPrompt}
          templateId={templateId}
          setTemplateId={setTemplateId}
          templates={templates}
          displayedReply={displayedReply}
          setDisplayedReply={setDisplayedReply}
          isEdited={isEdited}
          setIsEdited={setIsEdited}
          generateError={generateError}
          sendError={sendError}
          subjectLine={subjectLine}
          setSubjectLine={setSubjectLine}
          canGenerate={canGenerate}
          canSend={canSend}
          onGenerate={handleGenerate}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          currentAccount={currentAccount}
          accountId={accountId}
          toHeader={toHeader}
          style={{ flex: 1 }}
        />
      </div>

      <AppStatusbar right={`claude ${model === "haiku" ? "haiku-4-5" : "sonnet-4-6"}`} />

      {settingsOpen && (
        <SettingsModal
          theme={theme}
          onThemeChange={applyTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {toastVisible && <Toast exiting={toastExiting} />}
    </div>
  );
}
