export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #6366f1, #4338ca)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #ef4444, #b91c1c)",
  "linear-gradient(135deg, #a78bfa, #7c3aed)",
  "linear-gradient(135deg, #06b6d4, #0e7490)",
  "linear-gradient(135deg, #ec4899, #be185d)",
  "linear-gradient(135deg, #84cc16, #4d7c0f)",
];

export const LABEL_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
];

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getGradient(seed: string): string {
  return AVATAR_GRADIENTS[hashStr(seed) % AVATAR_GRADIENTS.length];
}

export function parseSender(from: string): { name: string; org: string } {
  const match = from.match(/^"?([^"<]+)"?\s*<([^>]*)>/);
  if (match) {
    const name = match[1].trim();
    const domain = match[2].split("@")[1] ?? "";
    return { name, org: domain.split(".")[0] ?? domain };
  }
  const atIdx = from.indexOf("@");
  if (atIdx !== -1) {
    return { name: from.slice(0, atIdx), org: from.slice(atIdx + 1).split(".")[0] };
  }
  return { name: from, org: "" };
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatWhen(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

export function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).toLowerCase().trim();
}
