import Link from "next/link";
import type { GmailMessage } from "@/lib/google";
import { Icon } from "./Icon";
import { parseSender, getInitials, getGradient, formatWhen } from "./utils";
import type { Label } from "./types";

interface Props {
  msg: GmailMessage;
  accountId: string;
  isLoading: boolean;
  onNavigate: (id: string) => void;
  isStarred: boolean;
  onStar: (id: string, starred: boolean) => void;
  onToggleSelect: (id: string) => void;
  isSelected: boolean;
  msgLabels: Label[];
}

export function EmailRow({
  msg, accountId, isLoading, onNavigate,
  isStarred, onStar, onToggleSelect, isSelected, msgLabels,
}: Props) {
  const { name, org } = parseSender(msg.from);
  const initials = getInitials(name || msg.from);
  const grad = getGradient(msg.from);
  const href = `/compose/${msg.id}?accountId=${encodeURIComponent(accountId)}`;

  return (
    <Link
      href={href}
      className={
        "row" +
        (msg.isUnread ? " unread" : "") +
        (isLoading ? " nav-loading" : "") +
        (isSelected ? " selected" : "")
      }
      onClick={(ev) => {
        if ((ev.target as HTMLElement).closest(".checkbox-area, .star-btn")) return;
        onNavigate(msg.id);
      }}
    >
      <span className="accent" />
      <span
        role="button"
        className={"checkbox-area" + (isSelected ? " checked" : "")}
        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onToggleSelect(msg.id); }}
      >
        {isSelected && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span
        role="button"
        className={"star-btn" + (isStarred ? " starred" : "")}
        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onStar(msg.id, !isStarred); }}
      >
        {isStarred ? <Icon name="star-fill" size={17} /> : <Icon name="star" size={17} />}
      </span>
      <span className="avatar" style={{ background: grad, width: 22, height: 22, fontSize: "10.5px" }}>
        {initials}
      </span>
      <span className="from-block">
        <span className="from">{name || msg.from}</span>
        <span className="org">{org}</span>
      </span>
      <span className="subj-block">
        <span className="subj">{msg.subject || "(件名なし)"}</span>
      </span>
      <span className="tags">
        {msgLabels.map((label) => (
          <span
            key={label.id}
            className="label-chip"
            style={{
              backgroundColor: `${label.color}22`,
              color: label.color,
              border: `1px solid ${label.color}55`,
            }}
          >
            <span className="label-chip-dot" style={{ background: label.color }} />
            {label.name}
          </span>
        ))}
      </span>
      {isLoading ? <span className="row-spinner" /> : <span className="when">{formatWhen(msg.date)}</span>}
    </Link>
  );
}
