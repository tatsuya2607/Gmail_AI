import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Gmail AI Reply",
  description: "AI-powered Gmail reply assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var s = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (s === 'light') { document.documentElement.dataset.theme = 'light'; }
              else if (s === 'dark') { document.documentElement.dataset.theme = 'dark'; }
              else { document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'; }
            } catch(e) { document.documentElement.dataset.theme = 'dark'; }
          })();
        ` }} />
      </head>
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
