import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interiørdesign Editor",
  description: "Endre farger og erstatt objekter i interiørbilder med AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className="antialiased">{children}</body>
    </html>
  );
}
