import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/context/LanguageContext";
import { TranslationProvider } from "@/lib/context/TranslationContext";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ✅ SEO optimized metadata
export const metadata: Metadata = {
  title: {
    default: "Edify - School Management System",
    template: "%s | Edify - School Management System",
  },
  description:
    "A modern school management system to manage students, teachers, attendance, exams, and administrative operations efficiently.",

  // 1. Manifest file link garnuhos (PWA support ko lagi)
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Edify",
  },

  // ... baki metadata (keywords, openGraph, etc.) ustai hunchha
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/edify-icon-192.png", // iPhone ko lagi shortcut ------------------
  },

  keywords: [
    "school management system",
    "student management",
    "attendance system",
    "school dashboard",
    "education software Nepal",
  ],
  authors: [{ name: "Your Company Name" }],
  creator: "Sempa Tech",
  metadataBase: new URL("https://school.edifynepal.com"), // 🔁 change this
  openGraph: {
    title: "Edify - School Management System",
    description:
      "Manage students, teachers, attendance, exams, and school operations easily with a modern dashboard.",
    url: "https://school.edifynepal.com", // 🔁 change this
    siteName: "Edify - School Management System",
    locale: "en_US",
    type: "website",
  },
  // icons: {
  //   icon: "/favicon.ico",
  // },
};

export default async function RootLayout({
  children,
 
}: {
  children: React.ReactNode;
  
}) {


  const messages = await getMessages();

  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased font-sans Nunito`}>
        {/* ✅ Toast Notification */}
        <Toaster
          richColors
          position="top-right"
          expand={false}
          toastOptions={{
            style: {
              padding: "6px 10px",
              fontSize: "10px",
              borderRadius: "4px",
              minWidth: "150px",
              maxWidth: "150px",
            },
            className: "font-sans",
          }}
        />

         <NextIntlClientProvider messages={messages}>
          <LanguageProvider>
            <TranslationProvider >
            <ThemeProvider>{children}</ThemeProvider>
            </TranslationProvider>
          </LanguageProvider>
        </NextIntlClientProvider>
      
      </body>
    </html>
  );
}
