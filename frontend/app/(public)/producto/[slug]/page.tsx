import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCordoba, getWhatsAppUrl } from "@/lib/utils";
import {
  MessageCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Truck,
  ArrowLeft,
  Package,
} from "lucide-react";

async function getProducto(slug: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${backendUrl}/api/public/productos/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getConfig() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${backendUrl}/api/public/configuracion`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProductoDetallePage({
  params,
}: {
  params: { slug: string };
}) {
  const [producto, config] = await Promise.all([
    getProducto(params.slug),
    getConfig(),
  ]);

  if (!producto) {
    notFound();
  }

  const whatsapp = config?.whatsapp || "8485-6722";
  const mensajeWhatsApp = `¡Hola Detalles y Más! Me gustaría consultar o pedir el producto "${producto.nombre}" (${formatCordoba(producto.precio_venta)}) que vi en su página web.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Enlace para volver */}
      <div>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cacao hover:text-borgona transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Galería de Fotos */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-artesanal overflow-hidden border border-kraft/70 bg-marfil shadow-md">
            {producto.imagen_url ? (
              <Image
                src={producto.imagen_url}
                alt={producto.nombre}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cacao">
                <Package className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Galería de miniaturas adicionales */}
          {producto.imagenes?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {producto.imagenes.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-kraft shrink-0 shadow-2xs"
                >
                  <Image src={img.url} alt={`Foto ${idx + 1}`} fill sizes="80px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalles del Producto y Acción de Compra por WhatsApp */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-dorado uppercase tracking-wider">
              {producto.categoria?.nombre} • Código: {producto.codigo}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate leading-tight">
              {producto.nombre}
            </h1>
            <div className="font-serif text-3xl font-bold text-borgona pt-2">
              {formatCordoba(producto.precio_venta)}
            </div>
          </div>

          {/* Insignia de Personalización */}
          {producto.es_personalizable && (
            <div className="p-3 bg-rosa-soft/60 border border-rosa-pastel rounded-lg flex items-center gap-2.5 text-xs text-chocolate">
              <Sparkles className="w-4 h-4 text-borgona shrink-0" />
              <span>
                <strong>¡Personalizable!</strong> Puedes pedir este detalle con nombres grabados, dedicatoria especial o colores a tu elección.
              </span>
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-2 text-sm text-cacao leading-relaxed border-y border-kraft/50 py-4">
            <h3 className="font-bold text-chocolate text-xs uppercase tracking-wider">
              Descripción del Detalle
            </h3>
            <p>{producto.descripcion || "Elaborado a mano con dedicación y materiales finos."}</p>
          </div>

          {/* Tiempos de entrega y elaboración */}
          <div className="space-y-2 text-xs text-cacao">
            {producto.tiempo_elaboracion_min ? (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-dorado" />
                <span>
                  Tiempo estimado de elaboración: <strong>{producto.tiempo_elaboracion_min} minutos</strong>
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-dorado" />
              <span>Envíos disponibles para Managua y por encomienda a departamentos.</span>
            </div>
          </div>

          {/* Botón WhatsApp */}
          <div className="pt-4">
            <a
              href={getWhatsAppUrl(whatsapp, mensajeWhatsApp)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-3 bg-borgona hover:bg-borgona-dark text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-98 text-base"
            >
              <MessageCircle className="w-5 h-5 text-dorado" />
              <span>Consultar / Pedir por WhatsApp</span>
            </a>
            <p className="text-[11px] text-cacao text-center mt-2">
              Te atenderemos directamente para coordinar fecha de entrega, colores y datos de pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

