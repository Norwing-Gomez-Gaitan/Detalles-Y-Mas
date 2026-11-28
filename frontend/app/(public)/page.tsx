import Link from "next/link";
import Image from "next/image";
import { formatCordoba, getWhatsAppUrl } from "@/lib/utils";
import {
  MessageCircle,
  ArrowRight,
  Sparkles,
  Heart,
  Truck,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";

async function getHomeData() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const [configRes, catsRes, destRes] = await Promise.all([
      fetch(`${backendUrl}/api/public/configuracion`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/public/categorias`, { cache: "no-store" }),
      fetch(`${backendUrl}/api/public/destacados`, { cache: "no-store" }),
    ]);

    const config = configRes.ok ? await configRes.json() : null;
    const categorias = catsRes.ok ? await catsRes.json() : [];
    const destacados = destRes.ok ? await destRes.json() : [];

    return {
      config: config || {
        nombre: "Detalles y Más",
        lema: "Hecho con amor para cada ocasión",
        whatsapp: "8485-6722",
        telefono: "8485-6722",
        direccion_cobertura: "Km8 carretera norte entrada Rocargo 4c al Norte 2 abajo media al sur",
        horario: "Lunes a Sábado: 8:00 AM - 6:00 PM",
      },
      categorias,
      destacados,
    };
  } catch (error) {
    // Si el servidor backend local está iniciando o no responde, usar valores seguros por defecto
    return {
      config: {
        nombre: "Detalles y Más",
        lema: "Hecho con amor para cada ocasión",
        whatsapp: "8485-6722",
        telefono: "8485-6722",
        direccion_cobertura: "Km8 carretera norte entrada Rocargo 4c al Norte 2 abajo media al sur",
        horario: "Lunes a Sábado: 8:00 AM - 6:00 PM",
      },
      categorias: [],
      destacados: [],
    };
  }
}

export default async function HomePage() {
  const { config, categorias, destacados } = await getHomeData();
  const whatsapp = config?.whatsapp || "8485-6722";

  return (
    <div className="space-y-20 pb-16">
      {/* 1. SECCIÓN HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-marfil to-crema py-16 sm:py-24 border-b border-kraft/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto y Llamado a la Acción */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-rosa-soft px-4 py-1.5 rounded-full border border-rosa-pastel text-borgona text-xs font-bold tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-dorado" />
                <span>Emprendimiento Artesanal en Nicaragua</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-chocolate leading-tight">
                Detalles únicos,{" "}
                <span className="text-borgona italic font-normal">hechos con amor</span> para cada ocasión.
              </h1>

              <p className="text-base sm:text-lg text-cacao leading-relaxed max-w-xl mx-auto lg:mx-0">
                Arreglos florales, adornos navideños, cajas sorpresa para Sweet 15, cumpleaños y fechas inolvidables. Personalizamos cada detalle a tu gusto.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href={getWhatsAppUrl(
                    whatsapp,
                    "¡Hola! Me encantaría cotizar un detalle personalizado en Detalles y Más."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-borgona hover:bg-borgona-dark text-white font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 text-base"
                >
                  <MessageCircle className="w-5 h-5 text-dorado" />
                  <span>Pedir por WhatsApp</span>
                </a>

                <Link
                  href="/catalogo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-marfil hover:bg-crema border border-kraft text-chocolate font-bold px-8 py-3.5 rounded-full transition-colors text-base"
                >
                  <span>Ver Catálogo</span>
                  <ArrowRight className="w-4 h-4 text-dorado" />
                </Link>
              </div>

              {/* Badges de Confianza */}
              <div className="pt-6 border-t border-kraft/40 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-cacao font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-estado-exito" />
                  <span>100% Hecho a mano</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-dorado" />
                  <span>Envíos a toda Nicaragua</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-borgona" />
                  <span>Personalización total</span>
                </div>
              </div>
            </div>

            {/* Imagen Principal Destacada */}
            <div className="relative mx-auto lg:ml-auto w-full max-w-md lg:max-w-none">
              <div className="relative aspect-4/3 rounded-artesanal overflow-hidden shadow-2xl border-4 border-marfil">
                <Image
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=80"
                  alt="Arreglos florales y detalles artesanales"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-chocolate/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-marfil/90 backdrop-blur-xs p-4 rounded-lg border border-kraft/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-dorado uppercase tracking-wide">
                      Edición Especial
                    </span>
                    <h3 className="font-serif font-bold text-sm text-chocolate">
                      Rosas Eternas & Arreglos Finos
                    </h3>
                  </div>
                  <span className="font-serif font-bold text-borgona text-sm">
                    Desde C$ 450
                  </span>
                </div>
              </div>

              {/* Elemento Decorativo */}
              <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-rosa-pastel/50 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORÍAS POPULARES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-dorado">
            Explora por Ocasión
          </span>
          <h2 className="font-serif text-3xl font-bold text-chocolate">
            Nuestras Colecciones
          </h2>
          <p className="text-sm text-cacao max-w-lg mx-auto">
            Encuentra el regalo perfecto organizado para cumpleaños, aniversarios, quinceaños y festividades.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categorias.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/catalogo?categoria=${cat.id}`}
              className="group bg-marfil p-6 rounded-artesanal border border-kraft/70 shadow-xs hover:shadow-md hover:border-dorado transition-all text-center space-y-3"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-crema group-hover:bg-rosa-soft flex items-center justify-center transition-colors border border-kraft/60">
                <Sparkles className="w-6 h-6 text-borgona group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-serif font-bold text-base text-chocolate group-hover:text-borgona transition-colors">
                {cat.nombre}
              </h3>
              <p className="text-xs text-cacao line-clamp-2">
                {cat.descripcion || "Arreglos y detalles exclusivos."}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. PRODUCTOS DESTACADOS */}
      {destacados.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-dorado">
                Los Favoritos
              </span>
              <h2 className="font-serif text-3xl font-bold text-chocolate">
                Productos Destacados
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-sm font-bold text-borgona hover:text-borgona-dark flex items-center gap-1 group"
            >
              Ver catálogo completo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destacados.map((prod: any) => (
              <div
                key={prod.id}
                className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col group"
              >
                {/* Imagen del producto */}
                <Link
                  href={`/producto/${prod.slug}`}
                  className="relative aspect-square bg-crema overflow-hidden block"
                >
                  {prod.imagen_url ? (
                    <Image
                      src={prod.imagen_url}
                      alt={prod.nombre}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cacao">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  {prod.es_personalizable && (
                    <span className="absolute top-3 left-3 bg-marfil/90 backdrop-blur-xs text-borgona text-[10px] font-bold px-2 py-0.5 rounded-full border border-kraft shadow-2xs">
                      Personalizable
                    </span>
                  )}
                </Link>

                {/* Contenido */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-cacao uppercase tracking-wider">
                      {prod.categoria?.nombre}
                    </span>
                    <Link href={`/producto/${prod.slug}`}>
                      <h3 className="font-serif font-bold text-base text-chocolate hover:text-borgona transition-colors line-clamp-1">
                        {prod.nombre}
                      </h3>
                    </Link>
                    <p className="text-xs text-cacao line-clamp-2 mt-1">
                      {prod.descripcion}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-kraft/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-cacao block">Precio:</span>
                      <strong className="font-serif text-lg font-bold text-borgona">
                        {formatCordoba(prod.precio_venta)}
                      </strong>
                    </div>

                    <a
                      href={getWhatsAppUrl(
                        whatsapp,
                        `¡Hola Detalles y Más! Me interesa el producto: ${prod.nombre} (${formatCordoba(
                          prod.precio_venta
                        )}) que vi en su catálogo web.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-borgona hover:bg-borgona-dark text-white transition-colors shadow-sm"
                      title="Consultar por WhatsApp"
                      aria-label="Consultar por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-dorado" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SECCIÓN ¿POR QUÉ ELEGIR DETALLES Y MÁS? */}
      <section className="bg-marfil border-y border-kraft/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-dorado">
              Nuestro Compromiso
            </span>
            <h2 className="font-serif text-3xl font-bold text-chocolate">
              ¿Por qué confiar en nosotros?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 p-6 bg-crema/40 rounded-artesanal border border-kraft/50">
              <div className="w-12 h-12 mx-auto rounded-full bg-rosa-soft flex items-center justify-center text-borgona">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-chocolate">
                Artesanía con Pasión
              </h3>
              <p className="text-sm text-cacao leading-relaxed">
                Cada lazo, corte de foami, flor y dedicatoria se elabora a mano cuidando cada milímetro para que tu regalo sea inolvidable.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-crema/40 rounded-artesanal border border-kraft/50">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF8E7] flex items-center justify-center text-dorado">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-chocolate">
                Personalización a tu Medida
              </h3>
              <p className="text-sm text-cacao leading-relaxed">
                Elige los colores favoritos, la dedicatoria en caligrafía especial, nombres y mensajes con luces para crear una pieza irrepetible.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-crema/40 rounded-artesanal border border-kraft/50">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#EAF3E6] flex items-center justify-center text-estado-exito">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-chocolate">
                Puntualidad en la Entrega
              </h3>
              <p className="text-sm text-cacao leading-relaxed">
                Entendemos que los cumpleaños y aniversarios no esperan. Cumplimos con los tiempos pactados tanto en Managua como por encomienda.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

