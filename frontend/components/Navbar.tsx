"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/utils";

export function Navbar({ whatsapp = "8485-6722" }: { whatsapp?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-marfil/95 backdrop-blur-md border-b border-kraft/60 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo y Nombre */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-dorado shadow-sm">
              <Image
                src="/logo.png"
                alt="Logo Detalles y Más"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-borgona group-hover:text-borgona-dark transition-colors">
                Detalles y Más
              </span>
              <p className="text-xs text-cacao font-medium tracking-wide">
                Hecho con amor para cada ocasión
              </p>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-chocolate">
            <Link
              href="/"
              className="hover:text-borgona transition-colors py-2 border-b-2 border-transparent hover:border-borgona"
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className="hover:text-borgona transition-colors py-2 border-b-2 border-transparent hover:border-borgona"
            >
              Catálogo
            </Link>
            <Link
              href="/sobre-nosotros"
              className="hover:text-borgona transition-colors py-2 border-b-2 border-transparent hover:border-borgona"
            >
              Sobre Nosotros
            </Link>
          </nav>

          {/* Botón WhatsApp */}
          <div className="hidden md:flex items-center">
            <a
              href={getWhatsAppUrl(
                whatsapp,
                "¡Hola! Me gustaría consultar sobre sus productos y detalles personalizados."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-medium px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <MessageCircle className="w-5 h-5 text-dorado" />
              <span>Pedir por WhatsApp</span>
            </a>
          </div>

          {/* Botón Móvil */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-chocolate hover:text-borgona focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-marfil border-b border-kraft px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-semibold text-chocolate hover:bg-crema"
          >
            Inicio
          </Link>
          <Link
            href="/catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-semibold text-chocolate hover:bg-crema"
          >
            Catálogo
          </Link>
          <Link
            href="/sobre-nosotros"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-base font-semibold text-chocolate hover:bg-crema"
          >
            Sobre Nosotros
          </Link>
          <div className="pt-2">
            <a
              href={getWhatsAppUrl(
                whatsapp,
                "¡Hola! Me gustaría consultar sobre sus productos y detalles personalizados."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-borgona text-white font-medium px-4 py-3 rounded-full shadow-md"
            >
              <MessageCircle className="w-5 h-5 text-dorado" />
              <span>Pedir por WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

