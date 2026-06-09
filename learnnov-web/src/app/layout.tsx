import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LearnNov Platform",
  description: "منصة التعليم التفاعلي المتقدمة ليرنوف | LearnNov Advanced Interactive Education Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
