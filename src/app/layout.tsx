import type { Metadata } from "next";
import {  Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { Toaster } from "sonner";


const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"], 
});

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

  // 2. Mobile optimized icon ra theme color
  themeColor: "#4f46e5", // Tapaiko brand color (Indigo/Blue) halnuhos
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  
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
  metadataBase: new URL("https://yourdomain.com"), // 🔁 change this
  openGraph: {
    title: "Edify - School Management System",
    description:
      "Manage students, teachers, attendance, exams, and school operations easily with a modern dashboard.",
    url: "https://yourdomain.com", // 🔁 change this
    siteName: "Edify - School Management System",
    locale: "en_US",
    type: "website",
  },
  // icons: {
  //   icon: "/favicon.ico",
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

        {/* ✅ Theme Provider */}
        <ThemeProvider>
          {children}
        </ThemeProvider>

      </body>
    </html>
  );
}