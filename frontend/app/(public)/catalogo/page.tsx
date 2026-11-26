"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { formatCordoba, getWhatsAppUrl } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  Search,
  SlidersHorizontal,
  Package,
  MessageCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

function CatalogoContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoria") || "";

  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsapp, setWhatsapp] = useState("8485-6722");

  // Filtros
  const [categoria, setCategoria] = useState(initialCategory);
  const [buscar, setBuscar] = useState("");
  const [orden, setOrden] = useState("precio_asc");

  useEffect(() => {
    // Cargar categorías y configuración pública
    Promise.all([
      apiFetch("/api/public/categorias"),
      apiFetch("/api/public/configuracion"),
    ])
      .then(([cats, conf]) => {
        setCategorias(cats);
        if (conf?.whatsapp) setWhatsapp(conf.whatsapp);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (categoria) query.set("categoria", categoria);
    if (buscar.trim()) query.set("buscar", buscar.trim());
    if (orden) query.set("orden", orden);

    apiFetch(`/api/public/productos?${query.toString()}`)
      .then((data) => setProductos(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [categoria, buscar, orden]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Encabezado */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-dorado">
          Catálogo Artesanal
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
          Nuestros Detalles y Manualidades
        </h1>
        <p className="text-sm text-cacao max-w-xl mx-auto">
          Arreglos florales, adornos y recuerdos hechos a mano. Cotiza cualquier modelo o pídelo con tus colores y personalización favorita.
        </p>
      </div>

      {/* Barra de Filtros, Búsqueda y Orden */}
      <div className="bg-marfil p-4 rounded-artesanal border border-kraft/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cacao absolute left-3 top-3.5" />
          <input
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-9 pr-3 py-2 bg-crema/40 border border-kraft rounded-lg text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
          />
        </div>

        {/* Filtros de Categoría y Orden */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-crema/40 border border-kraft rounded-lg py-2 px-3 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none flex-1 md:flex-none"
          >
            <option value="">Todas las Categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="bg-crema/40 border border-kraft rounded-lg py-2 px-3 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none flex-1 md:flex-none"
          >
            <option value="precio_asc">Precio: Menor a Mayor</option>
            <option value="precio_desc">Precio: Mayor a Menor</option>
            <option value="nombre_asc">Nombre: A - Z</option>
          </select>
        </div>
      </div>

      {/* Grid de Productos */}
      {loading ? (
        <div className="py-24 text-center text-cacao space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-borgona" />
          <p className="text-sm">Cargando productos del catálogo...</p>
        </div>
      ) : productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productos.map((prod) => (
            <div
              key={prod.id}
              className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col group"
            >
              <Link
                href={`/producto/${prod.slug}`}
                className="relative aspect-square bg-crema overflow-hidden block"
              >
                {prod.imagen_url ? (
                  <Image
                    src={prod.imagen_url}
                    alt={prod.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                  >
                    <MessageCircle className="w-4 h-4 text-dorado" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-cacao bg-marfil rounded-artesanal border border-kraft/60 p-8 space-y-3">
          <Package className="w-10 h-10 mx-auto text-kraft" />
          <h3 className="font-serif text-lg font-bold text-chocolate">
            No se encontraron productos
          </h3>
          <p className="text-sm">
            Prueba ajustando los filtros de categoría o términos de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-cacao">Cargando catálogo...</div>}>
      <CatalogoContent />
    </Suspense>
  );
}

