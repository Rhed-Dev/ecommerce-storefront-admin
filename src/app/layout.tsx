import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Atelier — Considered goods for everyday rituals",
    template: "%s · Atelier",
  },
  description:
    "A demo e-commerce storefront with Stripe checkout, inventory management and a complete admin panel. Built with Next.js 15, Prisma and PostgreSQL.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
