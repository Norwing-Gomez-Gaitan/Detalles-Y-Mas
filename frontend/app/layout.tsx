import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Detalles y Más | Hecho con amor para cada ocasión - Nicaragua",
    template: "%s | Detalles y Más",
  },
  description:
    "Arreglos florales, adornos navideños, cajas sorpresa, detalles y recuerdos artesanales personalizados en Nicaragua. Hecho a mano con pasión y amor para cumpleaños, Sweet 15, bodas y ocasiones especiales.",
  keywords: [
    "manualidades Nicaragua",
    "arreglos florales Managua",
    "detalles personalizados",
    "regalos cumpleaños Nicaragua",
    "Sweet 15 Managua",
    "adornos navideños",
    "flores eternas Nicaragua",
  ],
  authors: [{ name: "Detalles y Más" }],
  openGraph: {
    title: "Detalles y Más | Hecho con amor para cada ocasión",
    description:
      "Arreglos, adornos y detalles artesanales personalizados para tus fechas más especiales en Nicaragua.",
    siteName: "Detalles y Más",
    locale: "es_NI",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Detalles y Más Logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

