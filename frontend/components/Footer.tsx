import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Instagram, Facebook, Clock, MapPin, Heart } from "lucide-react";
import { getWhatsAppUrl, formatPhoneNumber } from "@/lib/utils";

export function Footer({ config }: { config?: any }) {
  const whatsapp = config?.whatsapp || "8485-6722";
  const horario = config?.horario || "Lunes a Sábado: 8:00 AM - 6:00 PM";
  const direccion = config?.direccion_cobertura || "Managua, Nicaragua. Envíos a todo el país.";
  const instagram = config?.instagram || "@detallesymas.ni";
  const facebook = config?.facebook || "https://www.facebook.com/Aracelly82";

  return (
    <footer className="bg-chocolate text-crema mt-24 border-t-4 border-dorado">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Columna 1: Marca */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-dorado">
                <Image src="/logo.png" alt="Detalles y Más" fill sizes="40px" className="object-cover" />
              </div>
              <span className="font-serif text-xl font-bold text-marfil tracking-wide">
                Detalles y Más
              </span>
            </div>
            <p className="text-sm text-kraft-light leading-relaxed">
              Arreglos, adornos y regalos artesanales personalizados para cumpleaños, Sweet 15, bodas y Navidad.
            </p>
            <p className="text-xs text-dorado-light font-medium italic">
              "Hecho con amor para cada ocasión"
            </p>
          </div>

          {/* Columna 2: Enlaces */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-dorado">
              Explorar
            </h4>
            <ul className="space-y-2 text-sm text-kraft-light">
              <li>
                <Link href="/" className="hover:text-marfil transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="hover:text-marfil transition-colors">
                  Catálogo de Productos
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="hover:text-marfil transition-colors">
                  Sobre Nosotros y Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Horario y Cobertura */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-dorado">
              Atención
            </h4>
            <div className="space-y-2.5 text-sm text-kraft-light">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-dorado shrink-0 mt-0.5" />
                <span>{horario}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-dorado shrink-0 mt-0.5" />
                <span>{direccion}</span>
              </div>
            </div>
          </div>

          {/* Columna 4: Redes Sociales y WhatsApp */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-dorado">
              Conéctate
            </h4>
            <div className="flex gap-3">
              <a
                href={getWhatsAppUrl(whatsapp, "¡Hola Detalles y Más! Me gustaría hacer una consulta.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-borgona hover:bg-borgona-light text-white flex items-center justify-center transition-transform hover:scale-110 shadow"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5 text-dorado" />
              </a>
              <a
                href={`https://instagram.com/${instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#523330] hover:bg-borgona text-white flex items-center justify-center transition-transform hover:scale-110 shadow"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-dorado" />
              </a>
              <a
                href={facebook.startsWith("http") ? facebook : `https://facebook.com/${facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#523330] hover:bg-borgona text-white flex items-center justify-center transition-transform hover:scale-110 shadow"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-dorado" />
              </a>
            </div>
            <p className="text-xs text-kraft">
              WhatsApp: {formatPhoneNumber(whatsapp)}
            </p>
          </div>
        </div>

        {/* Separador y Copyright */}
        <div className="mt-12 pt-6 border-t border-chocolate-dark/50 flex flex-col sm:flex-row items-center justify-between text-xs text-kraft gap-4">
          <p>© {new Date().getFullYear()} Detalles y Más - Nicaragua. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 text-dorado">
            Hecho con <Heart className="w-3.5 h-3.5 fill-borgona text-borgona" /> en Managua, Nicaragua
          </p>
        </div>
      </div>
    </footer>
  );
}

