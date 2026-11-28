"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ExportDropdown } from "@/components/ExportDropdown";
import { formatCordoba } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  Package,
  Plus,
  Search,
  Check,
  X,
  Upload,
  Layers,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  Star,
} from "lucide-react";

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // Estado del modal de creación / edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Formulario
  const [form, setForm] = useState({
    categoria_id: 1,
    codigo: "",
    nombre: "",
    descripcion: "",
    precio_venta: 0,
    tiempo_elaboracion_min: 60,
    es_personalizable: false,
    stock_terminado: 0,
    imagen_url: "",
    visible_catalogo: true,
    destacado: false,
    materiales: [] as Array<{ material_id: number; cantidad: number }>,
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, matsRes] = await Promise.all([
        apiFetch("/api/admin/productos"),
        apiFetch("/api/admin/categorias"),
        apiFetch("/api/admin/materiales"),
      ]);
      setProductos(prodsRes);
      setCategorias(catsRes);
      setMateriales(matsRes);
      if (catsRes.length > 0 && form.categoria_id === 1) {
        setForm((prev) => ({ ...prev, categoria_id: catsRes[0].id }));
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalCrear = () => {
    setEditId(null);
    setForm({
      categoria_id: categorias[0]?.id || 1,
      codigo: `DET-${Math.floor(100 + Math.random() * 900)}`,
      nombre: "",
      descripcion: "",
      precio_venta: 500,
      tiempo_elaboracion_min: 60,
      es_personalizable: false,
      stock_terminado: 0,
      imagen_url: "",
      visible_catalogo: true,
      destacado: false,
      materiales: [],
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (p: any) => {
    setEditId(p.id);
    setForm({
      categoria_id: p.categoria_id,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio_venta: Number(p.precio_venta),
      tiempo_elaboracion_min: p.tiempo_elaboracion_min || 0,
      es_personalizable: p.es_personalizable,
      stock_terminado: p.stock_terminado || 0,
      imagen_url: p.imagen_url || "",
      visible_catalogo: p.visible_catalogo,
      destacado: p.destacado,
      materiales: p.materiales?.map((m: any) => ({
        material_id: m.material_id,
        cantidad: Number(m.cantidad),
      })) || [],
    });
    setModalOpen(true);
  };

  const handleToggleActivo = async (id: number) => {
    try {
      await apiFetch(`/api/admin/productos/${id}/toggle-activo`, { method: "PATCH" });
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("imagen", file);

      const res = await apiFetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.url) {
        setForm((prev) => ({ ...prev, imagen_url: res.url }));
      }
    } catch (err: any) {
      alert(err.message || "Error al subir imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const agregarLineaReceta = () => {
    if (materiales.length === 0) return;
    setForm((prev) => ({
      ...prev,
      materiales: [...prev.materiales, { material_id: materiales[0].id, cantidad: 1 }],
    }));
  };

  const quitarLineaReceta = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      materiales: prev.materiales.filter((_, i) => i !== idx),
    }));
  };

  const actualizarLineaReceta = (idx: number, campo: string, valor: any) => {
    setForm((prev) => {
      const copy = [...prev.materiales];
      copy[idx] = { ...copy[idx], [campo]: valor };
      return { ...prev, materiales: copy };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre || form.nombre.trim().length === 0) {
      alert("Validación: El nombre del producto es obligatorio.");
      return;
    }
    if (!form.codigo || form.codigo.trim().length === 0) {
      alert("Validación: El código del producto es obligatorio.");
      return;
    }
    if (form.precio_venta <= 0) {
      alert("Validación: El precio de venta debe ser mayor a C$ 0.00.");
      return;
    }

    if (costoRecetaCalculado > form.precio_venta && form.precio_venta > 0) {
      const confirmar = confirm(
        `Alerta de Rentabilidad: El costo total de materiales estimado (C$ ${costoRecetaCalculado.toFixed(2)}) supera el precio de venta (C$ ${form.precio_venta.toFixed(2)}). Esto generaría una pérdida por pieza. ¿Desea continuar y guardarlo de todas formas?`
      );
      if (!confirmar) return;
    }

    try {
      setSubmitting(true);
      const endpoint = editId ? `/api/admin/productos/${editId}` : "/api/admin/productos";
      const method = editId ? "PUT" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(form),
      });

      setModalOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al guardar producto");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado
  const productosFiltrados = productos.filter((p) => {
    const matchBuscar =
      p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      p.codigo.toLowerCase().includes(buscar.toLowerCase());
    const matchCat = filtroCategoria ? p.categoria_id === Number(filtroCategoria) : true;
    return matchBuscar && matchCat;
  });

  // Cálculo en vivo del costo de materiales de la receta
  const costoRecetaCalculado = form.materiales.reduce((sum, item) => {
    const mat = materiales.find((m) => m.id === Number(item.material_id));
    return sum + (mat ? Number(mat.costo_unitario) * Number(item.cantidad) : 0);
  }, 0);
  const gananciaRecetaCalculada = form.precio_venta - costoRecetaCalculado;
  const margenRecetaCalculado =
    form.precio_venta > 0
      ? ((gananciaRecetaCalculada / form.precio_venta) * 100).toFixed(1)
      : 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Gestión de Productos y Recetas" />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* Barra Superior con Buscador, Filtros y Botón Crear */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-cacao absolute left-3 top-3.5" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full pl-9 pr-3 py-2 bg-marfil border border-kraft rounded-lg text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Filtro por Categoría */}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-marfil border border-kraft rounded-lg py-2 px-3 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            >
              <option value="">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ExportDropdown tipo="productos" label="Exportar Productos" />

            <button
              onClick={abrirModalCrear}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Tabla de Productos con Recetas y Márgenes */}
        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Foto / SKU</th>
                  <th className="py-3 px-4">Producto y Categoría</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-right">Costo Receta</th>
                  <th className="py-3 px-4 text-right">Ganancia / Margen</th>
                  <th className="py-3 px-4 text-center">Catálogo</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kraft/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-cacao">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-borgona" />
                      Cargando catálogo...
                    </td>
                  </tr>
                ) : productosFiltrados.length > 0 ? (
                  productosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-crema/30 transition-colors">
                      {/* Foto y SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-crema border border-kraft/60 shrink-0">
                            {p.imagen_url ? (
                              <Image
                                src={p.imagen_url}
                                alt={p.nombre}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-cacao">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-mono font-bold text-borgona">
                              {p.codigo}
                            </span>
                            {p.destacado && (
                              <div className="flex items-center gap-1 text-[10px] text-dorado font-bold">
                                <Star className="w-3 h-3 fill-dorado" /> Destacado
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Nombre y Categoría */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-chocolate">{p.nombre}</div>
                        <div className="text-xs text-cacao">
                          {p.categoria?.nombre || "Sin categoría"}
                        </div>
                      </td>

                      {/* Precio de Venta */}
                      <td className="py-3 px-4 text-right font-serif font-bold text-chocolate">
                        {formatCordoba(p.precio_venta)}
                      </td>

                      {/* Costo de Materiales */}
                      <td className="py-3 px-4 text-right text-cacao font-medium">
                        {formatCordoba(p.costo_materiales)}
                      </td>

                      {/* Ganancia y Margen */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-estado-exito">
                          +{formatCordoba(p.ganancia_estimada)}
                        </div>
                        <div className="text-xs text-cacao">
                          {p.margen_pct}% margen
                        </div>
                      </td>

                      {/* Visible Catálogo */}
                      <td className="py-3 px-4 text-center">
                        {p.visible_catalogo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3E6] text-estado-exito">
                            Público
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-crema text-cacao">
                            Oculto
                          </span>
                        )}
                      </td>

                      {/* Activo / Inactivo */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActivo(p.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            p.activo
                              ? "bg-rosa-pastel text-borgona-dark hover:bg-rosa-soft"
                              : "bg-crema text-cacao hover:bg-kraft/40"
                          }`}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => abrirModalEditar(p)}
                          className="p-1.5 text-cacao hover:text-borgona hover:bg-crema rounded-lg transition-colors"
                          title="Editar producto y receta"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-cacao italic">
                      No se encontraron productos con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Crear / Editar Producto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Editar Producto y Receta" : "Nuevo Producto"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Categoría *
              </label>
              <select
                required
                value={form.categoria_id}
                onChange={(e) =>
                  setForm({ ...form, categoria_id: Number(e.target.value) })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Código SKU */}
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Código / SKU *
              </label>
              <input
                type="text"
                required
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Arreglo Floral Rosa Eterna..."
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Descripción para el Catálogo
              </label>
              <textarea
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Detalla qué incluye, materiales destacados y presentación..."
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Precio de Venta (C$) */}
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Precio de Venta (C$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.precio_venta}
                onChange={(e) =>
                  setForm({ ...form, precio_venta: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Tiempo de Elaboración (minutos) */}
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Tiempo de Elaboración (min)
              </label>
              <input
                type="number"
                min="0"
                value={form.tiempo_elaboracion_min}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tiempo_elaboracion_min: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Opciones booleanas */}
            <div className="sm:col-span-2 flex flex-wrap gap-6 py-2 border-y border-kraft/40">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-chocolate">
                <input
                  type="checkbox"
                  checked={form.es_personalizable}
                  onChange={(e) =>
                    setForm({ ...form, es_personalizable: e.target.checked })
                  }
                  className="rounded text-borgona focus:ring-borgona w-4 h-4"
                />
                <span>Es Personalizable (nombres, colores, dedicatoria)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-chocolate">
                <input
                  type="checkbox"
                  checked={form.visible_catalogo}
                  onChange={(e) =>
                    setForm({ ...form, visible_catalogo: e.target.checked })
                  }
                  className="rounded text-borgona focus:ring-borgona w-4 h-4"
                />
                <span>Visible en Catálogo Público</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-chocolate">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) =>
                    setForm({ ...form, destacado: e.target.checked })
                  }
                  className="rounded text-borgona focus:ring-borgona w-4 h-4"
                />
                <span className="flex items-center gap-1 text-dorado font-bold">
                  <Star className="w-3.5 h-3.5 fill-dorado" /> Destacar en Inicio
                </span>
              </label>
            </div>

            {/* Imagen Principal y Subida a Supabase Storage */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Imagen del Producto (Supabase Storage)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={form.imagen_url}
                  onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
                  placeholder="URL pública o sube un archivo..."
                  className="flex-1 bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
                <label className="cursor-pointer bg-kraft hover:bg-kraft/80 text-chocolate px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploadingImage ? "Subiendo..." : "Subir Foto"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              {form.imagen_url && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-kraft mt-2">
                  <Image
                    src={form.imagen_url}
                    alt="Vista previa"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sección de Receta de Materiales */}
          <div className="bg-crema/40 p-4 rounded-artesanal border border-kraft/70 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-chocolate text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-borgona" />
                  Receta de Materiales (Insumos)
                </h4>
                <p className="text-xs text-cacao">
                  Define qué insumos se consumen para calcular el costo y margen de ganancia.
                </p>
              </div>
              <button
                type="button"
                onClick={agregarLineaReceta}
                className="text-xs font-bold text-borgona hover:text-borgona-dark bg-rosa-pastel/60 hover:bg-rosa-pastel px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Insumo
              </button>
            </div>

            {form.materiales.length > 0 ? (
              <div className="space-y-2">
                {form.materiales.map((item, idx) => {
                  const mat = materiales.find((m) => m.id === Number(item.material_id));
                  const costoSub = mat
                    ? Number(mat.costo_unitario) * Number(item.cantidad)
                    : 0;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-marfil p-2.5 rounded-lg border border-kraft/60 text-xs"
                    >
                      <select
                        value={item.material_id}
                        onChange={(e) =>
                          actualizarLineaReceta(idx, "material_id", Number(e.target.value))
                        }
                        className="flex-1 bg-transparent font-medium text-chocolate outline-none"
                      >
                        {materiales.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre} ({formatCordoba(m.costo_unitario)} / {m.unidad_medida})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-cacao">Cant:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.cantidad}
                          onChange={(e) =>
                            actualizarLineaReceta(idx, "cantidad", parseFloat(e.target.value) || 0)
                          }
                          className="w-16 bg-crema/60 border border-kraft rounded px-1.5 py-1 text-right text-chocolate"
                        />
                        <span className="text-cacao font-mono">
                          {mat?.unidad_medida}
                        </span>
                      </div>

                      <div className="w-20 text-right font-bold text-borgona">
                        {formatCordoba(costoSub)}
                      </div>

                      <button
                        type="button"
                        onClick={() => quitarLineaReceta(idx)}
                        className="text-estado-error hover:bg-rosa-soft p-1 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-cacao italic text-center py-2">
                Sin materiales asignados. Agrega insumos para calcular el costo de elaboración.
              </p>
            )}

            {/* Resumen de Margen en Vivo */}
            <div className="flex items-center justify-between pt-3 border-t border-kraft/40 text-xs">
              <div>
                <span className="text-cacao">Costo Total Materiales: </span>
                <strong className="text-chocolate">
                  {formatCordoba(costoRecetaCalculado)}
                </strong>
              </div>
              <div>
                <span className="text-cacao">Ganancia Estimada: </span>
                <strong className="text-estado-exito font-bold">
                  {formatCordoba(gananciaRecetaCalculada)} ({margenRecetaCalculado}%)
                </strong>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-lg border border-kraft text-chocolate text-sm font-semibold hover:bg-crema transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Producto"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

