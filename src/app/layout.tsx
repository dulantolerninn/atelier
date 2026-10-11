import type { Metadata } from "next";
import "./globals.css";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { themeInitScript } from "@/lib/theme";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = { title: APP_NAME, description: APP_DESCRIPTION };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head>
      <body>{children}<Toaster /></body>
    </html>
  );
}
