export function AppStatusbar({
  right,
}: {
  right?: React.ReactNode;
} = {}) {
  return (
    <div className="app-statusbar">
      <span className="app-statusbar-item">
        <span className="app-statusbar-dot" />
        connected
      </span>
      {right && (
        <span className="app-statusbar-item right">{right}</span>
      )}
    </div>
  );
}
