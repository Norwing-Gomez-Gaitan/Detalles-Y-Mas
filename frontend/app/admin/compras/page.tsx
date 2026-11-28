"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ExportDropdown } from "@/components/ExportDropdown";
import { formatCordoba, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Truck, Plus, Trash2, X, Loader2, FileText } from "lucide-react";

export default function AdminComprasPage() {
  const [compras, setCompras] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal nueva compra
  const [modalCompraOpen, setModalCompraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formCompra, setFormCompra] = useState({
    proveedor_id: null as number | null,
    numero_factura: "",
    fecha: new Date().toISOString().split("T")[0],
    notas: "",
    detalles: [] as Array<{
      material_id: number;
      cantidad: number;
      costo_unitario: number;
    }>,
  });

  // Modal nuevo proveedor
  const [modalProvOpen, setModalProvOpen] = useState(false);
  const [formProv, setFormProv] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    notas: "",
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [comprasRes, provsRes, matsRes] = await Promise.all([
        apiFetch("/api/admin/compras"),
        apiFetch("/api/admin/proveedores"),
        apiFetch("/api/admin/materiales"),
      ]);
      setCompras(comprasRes);
      setProveedores(provsRes);
      setMateriales(matsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalCompra = () => {
    setFormCompra({
      proveedor_id: proveedores[0]?.id || null,
      numero_factura: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      fecha: new Date().toISOString().split("T")[0],
      notas: "",
      detalles: materiales.length > 0 ? [
        {
          material_id: materiales[0].id,
          cantidad: 10,
          costo_unitario: Number(materiales[0].costo_unitario) || 10,
        },
      ] : [],
    });
    setModalCompraOpen(true);
  };

  const agregarLineaDetalle = () => {
    if (materiales.length === 0) return;
    setFormCompra((prev) => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          material_id: materiales[0].id,
          cantidad: 1,
          costo_unitario: Number(materiales[0].costo_unitario) || 0,
        },
      ],
    }));
  };

  const quitarLineaDetalle = (idx: number) => {
    setFormCompra((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== idx),
    }));
  };

  const actualizarLinea = (idx: number, campo: string, valor: any) => {
    setFormCompra((prev) => {
      const copy = [...prev.detalles];
      copy[idx] = { ...copy[idx], [campo]: valor };
      // Si cambia de material, prellenar su costo anterior sugerido
      if (campo === "material_id") {
        const mat = materiales.find((m) => m.id === valor);
        if (mat) copy[idx].costo_unitario = Number(mat.costo_unitario);
      }
      return { ...prev, detalles: copy };
    });
  };

  const totalCalculado = formCompra.detalles.reduce(
    (sum, d) => sum + (d.cantidad * d.costo_unitario),
    0
  );

  const handleGuardarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formCompra.detalles.length === 0) {
      alert("Debe agregar al menos un material a la compra");
      return;
    }
    try {
      setSubmitting(true);
      await apiFetch("/api/admin/compras", {
        method: "POST",
        body: JSON.stringify(formCompra),
      });
      setModalCompraOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al registrar compra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/proveedores", {
        method: "POST",
        body: JSON.stringify(formProv),
      });
      setModalProvOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al registrar proveedor");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Compras e Insumos de Proveedores" />

      <div className="p-8 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cacao">
            Al registrar una compra, el inventario y el costo unitario se actualizan automáticamente en el sistema.
          </p>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <ExportDropdown tipo="compras" label="Exportar Compras" />
            <ExportDropdown tipo="proveedores" label="Exportar Proveedores" />

            <button
              onClick={() => setModalProvOpen(true)}
              className="flex items-center gap-1.5 bg-marfil border border-kraft hover:bg-crema px-3.5 py-2 rounded-lg text-sm font-semibold text-chocolate transition-colors"
            >
              <Truck className="w-4 h-4 text-dorado" />
              <span>Nuevo Proveedor</span>
            </button>
            <button
              onClick={abrirModalCompra}
              className="flex items-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Compra</span>
            </button>
          </div>
        </div>

        {/* Tabla de Compras */}
        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Nº Factura</th>
                <th className="py-3 px-4">Materiales Comprados</th>
                <th className="py-3 px-4 text-right">Total Factura (C$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-cacao">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-borgona" />
                    Cargando compras...
                  </td>
                </tr>
              ) : compras.length > 0 ? (
                compras.map((c) => (
                  <tr key={c.id} className="hover:bg-crema/30">
                    <td className="py-3 px-4 text-cacao">{formatDate(c.fecha)}</td>
                    <td className="py-3 px-4 font-semibold text-chocolate">
                      {c.proveedor?.nombre || "Proveedor General"}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-cacao">
                      {c.numero_factura || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-chocolate">
                      {c.detalles?.map((d: any) => `${d.cantidad} ${d.material?.unidad_medida} de ${d.material?.nombre}`).join(", ")}
                    </td>
                    <td className="py-3 px-4 text-right font-serif font-bold text-borgona">
                      {formatCordoba(c.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-cacao italic">
                    Sin compras registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Compra */}
      <Modal
        isOpen={modalCompraOpen}
        onClose={() => setModalCompraOpen(false)}
        title="Registrar Compra de Materiales"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleGuardarCompra} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Proveedor *
              </label>
              <select
                required
                value={formCompra.proveedor_id || ""}
                onChange={(e) =>
                  setFormCompra({
                    ...formCompra,
                    proveedor_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Nº Factura
              </label>
              <input
                type="text"
                value={formCompra.numero_factura}
                onChange={(e) =>
                  setFormCompra({ ...formCompra, numero_factura: e.target.value })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={formCompra.fecha}
                onChange={(e) =>
                  setFormCompra({ ...formCompra, fecha: e.target.value })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
          </div>

          {/* Líneas de Compra */}
          <div className="bg-crema/40 p-4 rounded-artesanal border border-kraft/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-chocolate">
                Líneas de Compra
              </span>
              <button
                type="button"
                onClick={agregarLineaDetalle}
                className="text-xs font-bold text-borgona hover:text-borgona-dark bg-rosa-pastel/60 px-3 py-1 rounded-lg"
              >
                + Agregar Insumo
              </button>
            </div>

            <div className="space-y-2">
              {formCompra.detalles.map((linea, idx) => {
                const sub = linea.cantidad * linea.costo_unitario;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-marfil p-2.5 rounded-lg border border-kraft/60 text-xs"
                  >
                    <select
                      value={linea.material_id}
                      onChange={(e) =>
                        actualizarLinea(idx, "material_id", Number(e.target.value))
                      }
                      className="flex-1 bg-transparent font-medium text-chocolate outline-none"
                    >
                      {materiales.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.unidad_medida})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-cacao">Cant:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={linea.cantidad}
                        onChange={(e) =>
                          actualizarLinea(idx, "cantidad", parseFloat(e.target.value) || 0)
                        }
                        className="w-16 bg-crema/60 border border-kraft rounded px-1.5 py-1 text-right text-chocolate"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-cacao">C/U (C$):</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={linea.costo_unitario}
                        onChange={(e) =>
                          actualizarLinea(idx, "costo_unitario", parseFloat(e.target.value) || 0)
                        }
                        className="w-20 bg-crema/60 border border-kraft rounded px-1.5 py-1 text-right text-chocolate"
                      />
                    </div>

                    <div className="w-20 text-right font-bold text-borgona">
                      {formatCordoba(sub)}
                    </div>

                    <button
                      type="button"
                      onClick={() => quitarLineaDetalle(idx)}
                      className="text-estado-error p-1 hover:bg-rosa-soft rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-kraft/40 text-sm">
              <span className="text-cacao mr-2">Total Compra:</span>
              <strong className="text-borgona font-serif text-base">
                {formatCordoba(totalCalculado)}
              </strong>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalCompraOpen(false)}
              className="px-4 py-2 border border-kraft rounded-lg text-sm font-semibold text-chocolate hover:bg-crema"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm"
            >
              {submitting ? "Guardando..." : "Registrar Compra"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Proveedor */}
      <Modal
        isOpen={modalProvOpen}
        onClose={() => setModalProvOpen(false)}
        title="Registrar Nuevo Proveedor"
      >
        <form onSubmit={handleGuardarProveedor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Nombre de la Empresa o Proveedor *
            </label>
            <input
              type="text"
              required
              value={formProv.nombre}
              onChange={(e) => setFormProv({ ...formProv, nombre: e.target.value })}
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Contacto
              </label>
              <input
                type="text"
                value={formProv.contacto}
                onChange={(e) => setFormProv({ ...formProv, contacto: e.target.value })}
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={formProv.telefono}
                onChange={(e) => setFormProv({ ...formProv, telefono: e.target.value })}
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalProvOpen(false)}
              className="px-4 py-2 border border-kraft rounded-lg text-sm font-semibold text-chocolate hover:bg-crema"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm"
            >
              Guardar Proveedor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

