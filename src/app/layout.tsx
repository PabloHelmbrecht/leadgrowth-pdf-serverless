import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Growth Dossier Generator",
  description: "Dossier Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={` antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
