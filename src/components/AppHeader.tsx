interface PathSegment {
  label: string;
  dim?: boolean;
}

export function AppHeader({
  pathSegments,
  right,
}: {
  pathSegments: PathSegment[];
  right?: React.ReactNode;
}) {
  return (
    <div className="app-header">
      <div className="app-brand">
        <span className="app-brand-mark">G</span>
        <span>Gmail AI</span>
      </div>
      <div className="app-path">
        {pathSegments.map((seg, i) => (
          <span key={i}>
            <span className="sep">/</span>
            <span style={seg.dim ? { color: "var(--fg-dim)" } : undefined}>
              {seg.label}
            </span>
          </span>
        ))}
      </div>
      {right && <div className="app-header-right">{right}</div>}
    </div>
  );
}
