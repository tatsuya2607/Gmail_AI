export function AppFooter({
  right,
}: {
  right?: React.ReactNode;
} = {}) {
  return (
    <div className="app-footer">
      <span className="app-footer-item">
        <span className="app-footer-dot" />
        connected
      </span>
      {right && <span className="app-footer-item right">{right}</span>}
    </div>
  );
}
