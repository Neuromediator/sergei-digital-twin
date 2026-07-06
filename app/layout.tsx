import type { Metadata } from "next";
import "./globals.css";
import { config } from "@/data/config";

export const metadata: Metadata = {
  title: `${config.name} — Ask me anything`,
  description: `Chat with ${config.name}'s digital twin about their experience, skills, projects, and background.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
