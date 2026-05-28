"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";
import { RecipientInput } from "@/components/RecipientInput";

interface Template {
  id: number;
  name: string;
  prompt: string;
}

type Phase = "idle" | "thinking" | "streaming" | "editable";

interface Props {
  model: "haiku" | "sonnet";
  onModelChange: (m: "haiku" | "sonnet") => void;
  phase: Phase;
  userPrompt: string;
  setUserPrompt: (v: string) => void;
  templateId: number | null;
  setTemplateId: (v: number | null) => void;
  templates: Template[];
  displayedReply: string;
  setDisplayedReply: (v: string) => void;
  setIsEdited: (v: boolean) => void;
  isEdited: boolean;
  generateError: string | null;
  sendError: string | null;
  subjectLine: string;
  setSubjectLine: (v: string) => void;
  canGenerate: boolean;
  canSend: boolean;
  onGenerate: () => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  toList: string[];
  setToList: (v: string[]) => void;
  ccList: string[];
  setCcList: (v: string[]) => void;
  bccList: string[];
  setBccList: (v: string[]) => void;
  showCc: boolean;
  setShowCc: (v: boolean) => void;
  showBcc: boolean;
  setShowBcc: (v: boolean) => void;
  style?: React.CSSProperties;
}

export function GeneratePane({
  model, onModelChange, phase,
  userPrompt, setUserPrompt,
  templateId, setTemplateId, templates,
  displayedReply, setDisplayedReply, isEdited, setIsEdited,
  generateError, sendError,
  subjectLine, setSubjectLine,
  canGenerate, canSend,
  onGenerate, onSend, onKeyDown,
  toList, setToList, ccList, setCcList, bccList, setBccList,
  showCc, setShowCc, showBcc, setShowBcc,
  style,
}: Props) {
  const [showTmplDropdown, setShowTmplDropdown] = useState(false);
  const [sectionsCollapsed, setSectionsCollapsed] = useState(false);
  const tmplBtnRef = useRef<HTMLButtonElement>(null);
  const selectedTemplate = templates.find((t) => t.id === templateId);

  // 生成完了で折りたたみ、idle で展開
  useEffect(() => {
    if (phase === "editable") setSectionsCollapsed(true);
    else if (phase === "idle") setSectionsCollapsed(false);
  }, [phase]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (tmplBtnRef.current && !tmplBtnRef.current.closest(".tmpl-scope")?.contains(e.target as Node)) {
        setShowTmplDropdown(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className="pane" style={style}>
      <div className="gen">

        {/* ── 折りたたみバー（生成完了後） ── */}
        {sectionsCollapsed ? (
          <div className="instr-collapsed">
            <span className="instr-preview">
              {userPrompt.slice(0, 70)}{userPrompt.length > 70 ? "…" : ""}
            </span>
            <button className="btn ghost btn-sm" onClick={() => setSectionsCollapsed(false)}>
              指示を編集
            </button>
            <button className="btn ghost btn-sm" disabled={!canGenerate} onClick={onGenerate}>
              <Icon name="refresh" size={12} />
              再生成
            </button>
          </div>
        ) : (
          <>
            {/* ── 指示セクション ── */}
            <div className="section">
              <div className="title-row">
                <h3>指示</h3>
              </div>
              <div className="instr-wrap">
                <textarea
                  className="instr"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="例: 丁寧にお断りする。来週なら都合がよいと伝える。"
                  rows={3}
                />
                <div className="instr-foot">
                  <span className="count">{userPrompt.length}/2000</span>
                </div>
              </div>
              {generateError && <div className="gen-error">{generateError}</div>}
            </div>

            {/* ── コントロールセクション ── */}
            <div className="section">
              <div className="ctrl-row">
                {/* テンプレート選択 */}
                <div className="field tmpl-scope" style={{ position: "relative" }}>
                  <label>テンプレート</label>
                  <button
                    ref={tmplBtnRef}
                    className="select"
                    style={{ width: "100%" }}
                    onClick={() => setShowTmplDropdown((v) => !v)}
                  >
                    <span className="v">{selectedTemplate?.name ?? "なし"}</span>
                    <span className="caret"><Icon name="chev" size={12} /></span>
                  </button>
                  {showTmplDropdown && (
                    <div className="dropdown" style={{ top: "calc(100% + 4px)", left: 0, position: "absolute" }}>
                      <div className="dd-opt" onClick={() => { setTemplateId(null); setShowTmplDropdown(false); }}>
                        {templateId === null && <span className="dd-check"><Icon name="check" size={14} /></span>}
                        <span>なし</span>
                      </div>
                      {templates.length > 0 && <div className="dd-sep" />}
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          className="dd-opt"
                          onClick={() => { setTemplateId(t.id); setShowTmplDropdown(false); }}
                        >
                          {t.id === templateId && <span className="dd-check"><Icon name="check" size={14} /></span>}
                          <div className="dd-info">
                            <span className="dd-name">{t.name}</span>
                            <span className="dd-mail">{t.prompt.slice(0, 45)}{t.prompt.length > 45 ? "…" : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* モデル切替 */}
                <div className="field">
                  <label>モデル</label>
                  <div className="model-toggle">
                    <button className={model === "haiku" ? "on" : ""} onClick={() => onModelChange("haiku")}>
                      <span className="ico haiku" />Haiku
                      <span style={{ color: "var(--fg-mute)", fontSize: "10px", marginLeft: "4px" }}>軽い返信</span>
                    </button>
                    <button className={model === "sonnet" ? "on" : ""} onClick={() => onModelChange("sonnet")}>
                      <span className="ico sonnet" />Sonnet
                      <span style={{ color: "var(--fg-mute)", fontSize: "10px", marginLeft: "4px" }}>重要メール</span>
                    </button>
                  </div>
                </div>

                {/* 生成ボタン */}
                <div className="field">
                  <label>&nbsp;</label>
                  <button className="btn primary" disabled={!canGenerate} onClick={onGenerate}>
                    {phase === "thinking" ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: "cp-spin 1s linear infinite" }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        生成中…
                      </>
                    ) : (
                      <>
                        <Icon name="sparkle" size={13} />
                        生成
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── 出力エリア ── */}
        <div className="out">
          <div className="out-head">
            <h3>返信ドラフト</h3>
            <div className="meta">
              {phase === "editable" && (
                <>
                  {isEdited && <span className="body-edited-pill"><Icon name="draft" size={10} />edited</span>}
                  <span>{displayedReply.length} chars</span>
                  <span>·</span>
                  <span>model: {model}</span>
                </>
              )}
            </div>
          </div>

          <div className="recip-stack">
            <RecipientInput
              label="To"
              values={toList}
              onChange={setToList}
              placeholder="recipient@example.com"
              rightSlot={
                <span className="recip-toggle">
                  {!showCc && (
                    <button type="button" onClick={() => setShowCc(true)}>Cc</button>
                  )}
                  {!showBcc && (
                    <button type="button" onClick={() => setShowBcc(true)}>Bcc</button>
                  )}
                </span>
              }
            />
            {showCc && (
              <RecipientInput
                label="Cc"
                values={ccList}
                onChange={setCcList}
                placeholder="cc@example.com"
                rightSlot={
                  <span className="recip-toggle">
                    <button type="button" onClick={() => { setShowCc(false); setCcList([]); }}>✕</button>
                  </span>
                }
              />
            )}
            {showBcc && (
              <RecipientInput
                label="Bcc"
                values={bccList}
                onChange={setBccList}
                placeholder="bcc@example.com"
                rightSlot={
                  <span className="recip-toggle">
                    <button type="button" onClick={() => { setShowBcc(false); setBccList([]); }}>✕</button>
                  </span>
                }
              />
            )}
          </div>

          <div className="subject-row">
            <span className="subject-prefix">Subject:</span>
            <input
              className="subject-input"
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
            />
          </div>

          {phase === "thinking" && (
            <div className="skeleton">
              <div className="sk-line" style={{ width: "88%" }} />
              <div className="sk-line" style={{ width: "100%" }} />
              <div className="sk-line" style={{ width: "75%" }} />
              <div className="sk-line" style={{ width: "93%" }} />
              <div className="sk-line" style={{ width: "62%" }} />
              <div className="sk-line" style={{ width: "80%" }} />
            </div>
          )}

          {(phase === "streaming" || phase === "editable") && (
            <textarea
              className="body-edit"
              value={displayedReply}
              onChange={(e) => { setDisplayedReply(e.target.value); setIsEdited(true); }}
              readOnly={phase === "streaming"}
              placeholder="生成された返信がここに表示されます"
            />
          )}

          {phase === "idle" && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--fg-faint)", fontFamily: "var(--mono)", fontSize: "11.5px",
              padding: "32px", flex: 1, border: "1px dashed var(--line)",
              borderRadius: "6px", marginTop: "4px",
            }}>
              指示とテンプレートを設定して「生成」を押してください
            </div>
          )}

          {sendError && <div className="gen-error">{sendError}</div>}
        </div>

        {/* ── アクションバー ── */}
        <div className="actions">
          <div className="spacer" />
          <button className="btn primary" disabled={!canSend} onClick={onSend}>
            <Icon name="send" size={13} />
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
