import { Icon } from "./Icon";

interface Props {
  exiting: boolean;
}

export function Toast({ exiting }: Props) {
  return (
    <div className="toast-wrap">
      <div className={`toast${exiting ? " exit" : ""}`}>
        <span className="t-icon"><Icon name="check-circle" size={16} /></span>
        <div>
          <div className="t-title">送信しました</div>
          <div className="t-sub">受信トレイに戻ります…</div>
        </div>
        <div className="t-bar" />
      </div>
    </div>
  );
}
