interface PathSegment {
  label: string;
  dim?: boolean;
}

export function AppTitlebar({ pathSegments }: { pathSegments: PathSegment[] }) {
  return (
    <div className="app-titlebar">
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
    </div>
  );
}
