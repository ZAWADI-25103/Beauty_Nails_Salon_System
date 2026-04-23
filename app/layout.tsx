import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TanstackProvider } from "@/components/providers/TanstackProvider";
import AppClientLayer from "@/components/AppClientLayer";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  title: 'Beauty Nails Salon',
  description: 'Professional beauty salon management system',
  keywords: ['salon', 'beauty', 'nails', 'appointments', 'booking'],
  authors: [{ name: 'Beauty Nails Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-text font-geist-sans transition-colors duration-300 ease-in-out dark:bg-gray-950">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            {/* ✅ GLOBAL CLIENT FEATURES */}
            <AppClientLayer />
            <Toaster position="top-right" />
          </TanstackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
