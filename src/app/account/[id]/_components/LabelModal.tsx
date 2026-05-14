"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { LABEL_COLORS } from "./utils";
import type { Label, LabelRule } from "./types";

interface Props {
  labels: Label[];
  labelRules: LabelRule[];
  onCreateLabel: (name: string, color: string) => void;
  onDeleteLabel: (labelId: number) => void;
  onAddRule: (labelId: number, pattern: string) => void;
  onDeleteRule: (labelId: number, ruleId: number) => void;
  onClose: () => void;
}

export function LabelModal({
  labels, labelRules,
  onCreateLabel, onDeleteLabel, onAddRule, onDeleteRule,
  onClose,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newPattern, setNewPattern] = useState("");

  function handleClose() {
    setExpandedId(null);
    setNewPattern("");
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal modal-label" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>ラベルの管理</span>
          <button className="icon-btn" style={{ fontSize: 16, color: "var(--fg-mute)" }} onClick={handleClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* ── 新規作成 ── */}
          <div className="modal-section-title">新しいラベル</div>
          <div className="label-create-row">
            <input
              className="label-name-input"
              placeholder="ラベル名..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { onCreateLabel(newName.trim(), newColor); setNewName(""); } }}
            />
            <div className="color-picker">
              {LABEL_COLORS.map((c) => (
                <span
                  key={c}
                  role="button"
                  className={"color-swatch" + (newColor === c ? " selected" : "")}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
            <button
              className="modal-btn-primary"
              disabled={!newName.trim()}
              onClick={() => { onCreateLabel(newName.trim(), newColor); setNewName(""); }}
            >
              作成
            </button>
          </div>

          {/* ── 既存ラベル ── */}
          {labels.length > 0 && (
            <>
              <div className="modal-section-title" style={{ marginTop: 16 }}>既存のラベル</div>
              <div className="label-list">
                {labels.map((label) => {
                  const rules = labelRules.filter((r) => r.label_id === label.id);
                  const isExpanded = expandedId === label.id;
                  return (
                    <div key={label.id} className="label-accordion">
                      <div className="label-accordion-head">
                        <span className="label-dot" style={{ background: label.color }} />
                        <span className="label-acc-name">{label.name}</span>
                        <span className="label-rule-count">{rules.length} ルール</span>
                        <span
                          role="button"
                          className={"label-expand-btn" + (isExpanded ? " open" : "")}
                          onClick={() => { setExpandedId(isExpanded ? null : label.id); setNewPattern(""); }}
                        >
                          <Icon name="chev" size={12} />
                        </span>
                        <span role="button" className="label-delete-btn" onClick={() => onDeleteLabel(label.id)}>
                          <Icon name="trash" size={12} />
                        </span>
                      </div>
                      {isExpanded && (
                        <div className="label-accordion-body">
                          {rules.length === 0 && <div className="rule-empty">パターンが登録されていません</div>}
                          <div className="rule-list">
                            {rules.map((rule) => (
                              <div key={rule.id} className="rule-item">
                                <span className="rule-pattern">{rule.pattern}</span>
                                <span role="button" className="rule-delete" onClick={() => onDeleteRule(label.id, rule.id)}>✕</span>
                              </div>
                            ))}
                          </div>
                          <div className="rule-add-row">
                            <input
                              className="rule-input"
                              placeholder="user@example.com または example.com"
                              value={newPattern}
                              onChange={(e) => setNewPattern(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && newPattern.trim()) { onAddRule(label.id, newPattern); setNewPattern(""); } }}
                            />
                            <button
                              className="modal-btn-primary"
                              style={{ padding: "5px 12px", fontSize: 12 }}
                              disabled={!newPattern.trim()}
                              onClick={() => { onAddRule(label.id, newPattern); setNewPattern(""); }}
                            >
                              追加
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
