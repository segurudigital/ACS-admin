import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { HierarchicalPermissionProvider } from "@/contexts/HierarchicalPermissionContext";
import { ToastProvider } from "@/contexts/ToastContext";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Adventist Community Services Admin Area",
  description: "Adventist Community Services admin area login",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/logo-white.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo-white.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <HierarchicalPermissionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </HierarchicalPermissionProvider>
      </body>
    </html>
  );
}
