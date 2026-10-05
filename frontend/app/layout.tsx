import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "WallAI - AI-moderated message wall on GenLayer",
  description:
    "Post short messages to a public wall. Every post is reviewed by an AI moderator and agreed on by GenLayer validators.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
