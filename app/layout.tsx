import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLAPR",
  description: "Crypto-native image and video prompt generation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
