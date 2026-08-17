import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PermissionProvider } from "@/context/PermissionContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "LearnNov Platform",
  description: "منصة التعليم التفاعلي المتقدمة ليرنوف | LearnNov Advanced Interactive Education Platform",
  verification: {
    google: "NnzPzRekZrXsc5dHY6yaFWrDLtMnatE0zrLXMZTfUK0",
  },
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
            <PermissionProvider>
              <Navbar />
              <div style={{ minHeight: 'calc(100vh - 250px)' }}>
                {children}
              </div>
              <Footer />
            </PermissionProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
