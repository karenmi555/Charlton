import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { UserProvider } from "@/lib/identity/context";
import { getUsers } from "@/lib/actions/users";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const users = await getUsers();
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <UserProvider allUsers={users}>{children}</UserProvider>
      </body>
    </html>
  );
}
