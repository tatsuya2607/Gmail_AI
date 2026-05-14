import { Icon } from "./Icon";
import type { Label } from "./types";
import type { GmailMessage } from "@/lib/google";

interface Props {
  view: "inbox" | "starred" | "trash";
  activeLabel: number | null;
  allMessages: GmailMessage[];
  trashedMessages: GmailMessage[];
  starredCount: number;
  labels: Label[];
  labelCounts: Record<number, number>;
  onSetView: (v: "inbox" | "starred" | "trash") => void;
  onSetActiveLabel: (id: number | null) => void;
  onCompose: () => void;
  onManageLabels: () => void;
}

export function InboxSidebar({
  view, activeLabel, allMessages, trashedMessages, starredCount,
  labels, labelCounts, onSetView, onSetActiveLabel, onCompose, onManageLabels,
}: Props) {
  const inboxActive = activeLabel === null && view === "inbox";
  const starredActive = activeLabel === null && view === "starred";
  const trashActive = view === "trash";

  return (
    <div className="pane side">
      <button className="compose-btn" onClick={onCompose}>
        <Icon name="plus" size={13} />
        <span className="lbl">作成</span>
      </button>

      <div className="grp">mailboxes</div>
      <div className="nav">
        <div
          className={"nav-item" + (inboxActive ? " active" : "")}
          onClick={() => { onSetView("inbox"); onSetActiveLabel(null); }}
        >
          <span className="ico"><Icon name="inbox" size={13} /></span>
          <span className="lbl">受信トレイ</span>
          <span className="count">{allMessages.length}</span>
        </div>
        <div
          className={"nav-item" + (starredActive ? " active" : "")}
          onClick={() => { onSetView("starred"); onSetActiveLabel(null); }}
        >
          <span className="ico"><Icon name="star" size={13} /></span>
          <span className="lbl">スター付き</span>
          <span className="count">{starredCount}</span>
        </div>
        <div
          className={"nav-item trash-nav" + (trashActive ? " active" : "")}
          onClick={() => { onSetView("trash"); onSetActiveLabel(null); }}
        >
          <span className="ico"><Icon name="trash" size={13} /></span>
          <span className="lbl">ゴミ箱</span>
          {trashedMessages.length > 0 && <span className="count">{trashedMessages.length}</span>}
        </div>
      </div>

      {labels.length > 0 && (
        <>
          <div className="grp">labels</div>
          <div className="nav">
            {labels.map((label) => (
              <div
                key={label.id}
                className={"nav-item" + (activeLabel === label.id ? " active" : "")}
                onClick={() => { onSetActiveLabel(label.id); onSetView("inbox"); }}
              >
                <span className="ico">
                  <span className="nav-label-dot" style={{ background: label.color }} />
                </span>
                <span className="lbl">{label.name}</span>
                <span className="count">{labelCounts[label.id] ?? 0}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="nav" style={{ marginTop: 4 }}>
        <div className="nav-item label-manage-item" onClick={onManageLabels}>
          <span className="ico"><Icon name="tag" size={12} /></span>
          <span className="lbl">ラベルを管理</span>
        </div>
      </div>
    </div>
  );
}
