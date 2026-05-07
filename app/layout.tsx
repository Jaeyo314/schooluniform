import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class Uniform Order",
  description: "Order class uniforms with size, back number, initial, shorts, and long-sleeve options.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
