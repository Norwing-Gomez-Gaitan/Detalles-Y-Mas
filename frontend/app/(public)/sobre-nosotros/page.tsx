import Image from "next/image";
import { MessageCircle, MapPin, Clock, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import { getWhatsAppUrl, formatPhoneNumber } from "@/lib/utils";

async function getConfig() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${backendUrl}/api/public/configuracion`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      nombre: "Detalles y Más",
      lema: "Hecho con amor para cada ocasión",
      whatsapp: "8485-6722",
      telefono: "8485-6722",
      instagram: "@detallesymas.ni",
      facebook: "https://www.facebook.com/Aracelly82",
      direccion_cobertura: "Managua, Nicaragua. Envíos a todo el país.",
      horario: "Lunes a Sábado: 8:00 AM - 6:00 PM",
      sobre_nosotros: "Somos un taller de manualidades y detalles personalizados en Nicaragua. Elaboramos arreglos, adornos y recuerdos únicos hechos a mano con pasión y amor para cada ocasión especial.",
    };
  }
}

export default async function SobreNosotrosPage() {
  const config = await getConfig();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Sección Historia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-dorado">
            Nuestra Esencia
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate leading-tight">
            Sobre Detalles y Más
          </h1>
          <p className="text-base text-cacao leading-relaxed">
            {config.sobre_nosotros}
          </p>
          <p className="text-base text-cacao leading-relaxed">
            Cada ocasión tiene un significado especial: un cumpleaños esperado, unos quinceaños (Sweet 15) soñados, la llegada de la Navidad o un aniversario de amor. En nuestro taller nos dedicamos a que cada cliente encuentre una pieza que hable desde el corazón.
          </p>

          <div className="pt-2 flex items-center gap-2 text-borgona font-serif font-bold text-lg">
            <Heart className="w-5 h-5 fill-borgona" />
            <span>"{config.lema}"</span>
          </div>
        </div>

        <div className="relative aspect-4/3 rounded-artesanal overflow-hidden border-4 border-marfil shadow-xl">
          <Image
            src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80"
            alt="Taller de manualidades y detalles personalizados"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Información de Cobertura, Contacto y Horarios */}
      <div className="bg-marfil rounded-artesanal border border-kraft/70 p-8 shadow-xs">
        <div className="text-center space-y-2 mb-8">
          <h2 className="font-serif text-2xl font-bold text-chocolate">
            Información de Contacto y Envíos
          </h2>
          <p className="text-xs text-cacao">
            Estamos disponibles para responder tus consultas y coordinar tus pedidos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-crema/40 rounded-artesanal border border-kraft/50 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-rosa-soft flex items-center justify-center text-borgona">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-chocolate">Cobertura de Entrega</h3>
            <p className="text-xs text-cacao">{config.direccion_cobertura}</p>
          </div>

          <div className="p-6 bg-crema/40 rounded-artesanal border border-kraft/50 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#FFF8E7] flex items-center justify-center text-dorado">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-chocolate">Horario de Atención</h3>
            <p className="text-xs text-cacao">{config.horario}</p>
          </div>

          <div className="p-6 bg-crema/40 rounded-artesanal border border-kraft/50 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#EAF3E6] flex items-center justify-center text-estado-exito">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-chocolate">WhatsApp Directo</h3>
            <p className="text-sm font-semibold text-chocolate">{formatPhoneNumber(config.whatsapp)}</p>
            <a
              href={getWhatsAppUrl(config.whatsapp || "8485-6722", "¡Hola! Me gustaría cotizar un detalle personalizado.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-bold text-borgona hover:underline"
            >
              Chatear ahora →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

