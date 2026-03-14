import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter" 
});

const bebas = Bebas_Neue({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas" 
});

export const metadata: Metadata = {
  title: "Netflix Clone",
  description: "A premium Netflix clone built with Next.js 14",
};

import { ApolloWrapper } from "@/lib/apollo-wrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className="bg-background text-white font-inter" suppressHydrationWarning>
        <ApolloWrapper>
          {children}
        </ApolloWrapper>
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
