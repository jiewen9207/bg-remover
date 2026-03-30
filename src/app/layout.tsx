import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BG Remover - Remove Image Backgrounds",
  description: "Remove image backgrounds in seconds — no signup required",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col items-center py-12 px-4">
        {children}
      </body>
    </html>
  );
}