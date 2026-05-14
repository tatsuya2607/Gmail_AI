export function Icon({ name, size = 14 }: { name: string; size?: number }) {
  let content: React.ReactNode = null;

  if (name === "send")
    content = <><path d="M22 2 11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 2l-7 20-4-9-9-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "sparkle")
    content = <><path d="M12 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="M12 17v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="M3 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="M17 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="m5.6 5.6 2.8 2.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="m15.6 15.6 2.8 2.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="m5.6 18.4 2.8-2.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /><path d="m15.6 8.4 2.8-2.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></>;
  else if (name === "refresh")
    content = <><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 3v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 21v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "draft")
    content = <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "chev")
    content = <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
  else if (name === "check")
    content = <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
  else if (name === "settings")
    content = <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" /></>;
  else if (name === "template")
    content = <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>;
  else if (name === "check-circle")
    content = <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "inbox")
    content = <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (name === "home")
    content = <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {content}
    </svg>
  );
}
