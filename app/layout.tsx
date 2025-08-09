import type { Metadata } from "next";
import Providers from "./components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jira Dashboard",
  description: "Jira Dashboard",
  generator: "Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
