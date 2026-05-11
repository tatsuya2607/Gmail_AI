"use client";

import { useState } from "react";

interface Template {
  id: number;
  name: string;
  prompt: string;
  updated_at: number;
}

const EMPTY_FORM = { name: "", prompt: "" };

export function TemplatesClient({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(t: Template) {
    setEditingId(t.id);
    setEditForm({ name: t.name, prompt: t.prompt });
    setShowAdd(false);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
    setError(null);
  }

  function openAdd() {
    setShowAdd(true);
    setAddForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
  }

  async function handleAdd() {
    if (!addForm.name.trim() || !addForm.prompt.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "ja"))
      );
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editForm.name.trim() || !editForm.prompt.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates((prev) =>
        prev
          .map((t) => (t.id === editingId ? data : t))
          .sort((a, b) => a.name.localeCompare(b.name, "ja"))
      );
      setEditingId(null);
      setEditForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{templates.length} 件のテンプレート</p>
        {!showAdd && (
          <button
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + 新規追加
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Add form */}
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

      {/* Template list */}
      {templates.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-1">テンプレートがありません</p>
          <p className="text-sm">「新規追加」からテンプレートを作成してください</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
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
              <li
                key={t.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{t.name}</p>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2 whitespace-pre-wrap">
                      {t.prompt}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      更新: {new Date(t.updated_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => startEdit(t)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="text-sm text-red-500 hover:text-red-400 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function FormCard({
  title,
  form,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  form: { name: string; prompt: string };
  onChange: (f: { name: string; prompt: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-blue-800 rounded-xl px-5 py-4 flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">{title}</p>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          名前 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="例: 丁寧な断り"
          className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          AI への指示 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.prompt}
          onChange={(e) => onChange({ ...form, prompt: e.target.value })}
          placeholder="例: 相手の提案に感謝しつつ、丁寧にお断りする。代替案があれば添える。"
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim() || !form.prompt.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
