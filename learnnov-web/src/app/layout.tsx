import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnNov | لوحة الطالب",
  description: "المنصة الأكاديمية الذكية الأولى",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
