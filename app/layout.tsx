import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { IdentityProvider } from "@/lib/identity/context";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The apartment",
  description: "Shared calendar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <IdentityProvider>{children}</IdentityProvider>
      </body>
    </html>
  );
}
