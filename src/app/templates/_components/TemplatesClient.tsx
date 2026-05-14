"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PageToolbar } from "@/components/PageToolbar";

interface Template {
  id: number;
  name: string;
  prompt: string;
  updated_at: number;
}

interface Account {
  id: string;
  email: string;
  name: string | null;
}

interface Props {
  initial: Template[];
  accounts: Account[];
  accountId: string;
}

const EMPTY = { name: "", prompt: "" };

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function TemplatesClient({ initial, accounts, accountId }: Props) {
  const [templates, setTemplates] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

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
        document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        localStorage.setItem("theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  }

  function startEdit(t: Template) {
    setEditingId(t.id);
    setEditForm({ name: t.name, prompt: t.prompt });
    setShowAdd(false);
    setError(null);
  }
  function cancelEdit() { setEditingId(null); setEditForm(EMPTY); setError(null); }
  function openAdd() { setShowAdd(true); setAddForm(EMPTY); setEditingId(null); setError(null); }

  async function handleAdd() {
    if (!addForm.name.trim() || !addForm.prompt.trim()) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "ja")));
      setShowAdd(false); setAddForm(EMPTY);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally { setSaving(false); }
  }

  async function handleSaveEdit() {
    if (!editForm.name.trim() || !editForm.prompt.trim()) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingId ? data : t)).sort((a, b) => a.name.localeCompare(b.name, "ja"))
      );
      setEditingId(null); setEditForm(EMPTY);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  const inboxHref = accountId ? `/account/${encodeURIComponent(accountId)}` : "/";

  return (
    <>
      <AppHeader
        pathSegments={[{ label: "templates", dim: true }]}
        right={
          <button className="icon-btn" title="設定" onClick={() => setSettingsOpen(true)}>
            <GearIcon />
          </button>
        }
      />
      <PageToolbar
        accountId={accountId}
        accounts={accounts}
        crumbs={[
          { icon: "home", href: "/" },
          { icon: "inbox", label: "Inbox", href: inboxHref },
          { icon: "template", label: "Templates", active: true },
        ]}
      />

      <div className="page-main">
        <div className="page-inner">
          {/* Page header */}
          <div className="page-header">
            <div className="page-title">
              <h1>テンプレート管理</h1>
              <div className="count">{templates.length} 件</div>
            </div>
            {!showAdd && (
              <button className="btn-primary" onClick={openAdd}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                新規追加
              </button>
            )}
          </div>

          {error && <div className="error-banner">{error}</div>}

          {showAdd && (
            <FormCard
              title="新規テンプレート"
              form={addForm}
              onChange={setAddForm}
              onSave={handleAdd}
              onCancel={() => { setShowAdd(false); setError(null); }}
              saving={saving}
            />
          )}

          {templates.length === 0 && !showAdd ? (
            <div className="empty">
              <h2>テンプレートがありません</h2>
              <p>「新規追加」からテンプレートを作成してください</p>
            </div>
          ) : (
            <>
              {templates.length > 0 && (
                <div className="section-label">登録済み ({templates.length})</div>
              )}
              <ul className="tmpl-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {templates.map((t) =>
                  editingId === t.id ? (
                    <li key={t.id}>
                      <FormCard
                        title="編集"
                        form={editForm}
                        onChange={setEditForm}
                        onSave={handleSaveEdit}
                        onCancel={cancelEdit}
                        saving={saving}
                      />
                    </li>
                  ) : (
                    <li key={t.id} className="tmpl-card">
                      <div className="tmpl-top">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="tmpl-name">{t.name}</div>
                          <div className="tmpl-prompt">{t.prompt}</div>
                          <div className="tmpl-meta">
                            更新: {new Date(t.updated_at).toLocaleDateString("ja-JP")}
                          </div>
                        </div>
                        <div className="tmpl-actions">
                          <button className="btn-edit" onClick={() => startEdit(t)}>編集</button>
                          <button className="btn-del" onClick={() => handleDelete(t.id, t.name)}>削除</button>
                        </div>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>設定</span>
              <button
                className="icon-btn"
                style={{ fontSize: 16, color: "var(--fg-mute)" }}
                onClick={() => setSettingsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <div className="settings-label">テーマ</div>
                <div className="theme-toggle">
                  <button className={theme === "system" ? "on" : ""} onClick={() => applyTheme("system")}>システム</button>
                  <button className={theme === "light" ? "on" : ""} onClick={() => applyTheme("light")}>ライト</button>
                  <button className={theme === "dark" ? "on" : ""} onClick={() => applyTheme("dark")}>ダーク</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FormCard({
  title, form, onChange, onSave, onCancel, saving,
}: {
  title: string;
  form: { name: string; prompt: string };
  onChange: (f: { name: string; prompt: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="form-card">
      <div className="form-title">{title}</div>
      <div className="field">
        <label>名前 <span>*</span></label>
        <input
          className="t-input"
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="例: 丁寧な断り"
        />
      </div>
      <div className="field">
        <label>AI への指示 <span>*</span></label>
        <textarea
          className="t-textarea"
          value={form.prompt}
          onChange={(e) => onChange({ ...form, prompt: e.target.value })}
          placeholder="例: 相手の提案に感謝しつつ、丁寧にお断りする。代替案があれば添える。"
          rows={4}
        />
      </div>
      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel} disabled={saving}>キャンセル</button>
        <button
          className="btn-save"
          onClick={onSave}
          disabled={saving || !form.name.trim() || !form.prompt.trim()}
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
