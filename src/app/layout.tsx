import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import StorageMigration from "@/components/storage-migration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fiona — Mental Health Assistant",
  description: "AI mental health and trading psychology assistant for Solana traders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <StorageMigration />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
