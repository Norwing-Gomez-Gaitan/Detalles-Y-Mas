"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { formatCordoba } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  Boxes,
  Plus,
  AlertTriangle,
  History,
  SlidersHorizontal,
  Loader2,
  Edit,
  Search,
} from "lucide-react";

export default function AdminInventarioPage() {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  // Modal material
  const [modalMaterialOpen, setModalMaterialOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formMaterial, setFormMaterial] = useState({
    nombre: "",
    unidad_medida: "unidad",
    stock_actual: 0,
    stock_minimo: 5,
    costo_unitario: 0,
    proveedor_id: null as number | null,
    activo: true,
  });

  // Modal ajuste
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [ajusteMaterial, setAjusteMaterial] = useState<any>(null);
  const [formAjuste, setFormAjuste] = useState({
    tipo: "ajuste",
    cantidad: 0,
    notas: "",
  });

  // Modal movimientos
  const [modalMovimientosOpen, setModalMovimientosOpen] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [matsRes, provsRes] = await Promise.all([
        apiFetch("/api/admin/materiales"),
        apiFetch("/api/admin/proveedores"),
      ]);
      setMateriales(matsRes);
      setProveedores(provsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalCrear = () => {
    setEditId(null);
    setFormMaterial({
      nombre: "",
      unidad_medida: "unidad",
      stock_actual: 0,
      stock_minimo: 5,
      costo_unitario: 0,
      proveedor_id: proveedores[0]?.id || null,
      activo: true,
    });
    setModalMaterialOpen(true);
  };

  const abrirModalEditar = (m: any) => {
    setEditId(m.id);
    setFormMaterial({
      nombre: m.nombre,
      unidad_medida: m.unidad_medida,
      stock_actual: Number(m.stock_actual),
      stock_minimo: Number(m.stock_minimo),
      costo_unitario: Number(m.costo_unitario),
      proveedor_id: m.proveedor_id,
      activo: m.activo,
    });
    setModalMaterialOpen(true);
  };

  const abrirModalAjustar = (m: any) => {
    setAjusteMaterial(m);
    setFormAjuste({ tipo: "ajuste", cantidad: 0, notas: "" });
    setModalAjusteOpen(true);
  };

  const abrirHistorialMovimientos = async () => {
    try {
      const movs = await apiFetch("/api/admin/materiales/movimientos");
      setMovimientos(movs);
      setModalMovimientosOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editId ? `/api/admin/materiales/${editId}` : "/api/admin/materiales";
      const method = editId ? "PUT" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(formMaterial),
      });

      setModalMaterialOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al guardar material");
    }
  };

  const handleGuardarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteMaterial) return;
    try {
      await apiFetch(`/api/admin/materiales/${ajusteMaterial.id}/ajustar`, {
        method: "POST",
        body: JSON.stringify(formAjuste),
      });
      setModalAjusteOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al ajustar inventario");
    }
  };

  const materialesFiltrados = materiales.filter((m) => {
    const matchBuscar = m.nombre.toLowerCase().includes(buscar.toLowerCase());
    const matchBajoStock = soloBajoStock ? m.bajo_stock : true;
    return matchBuscar && matchBajoStock;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Inventario y Materiales" />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* Barra de Controles */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-cacao absolute left-3 top-3.5" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar material o insumo..."
                className="w-full pl-9 pr-3 py-2 bg-marfil border border-kraft rounded-lg text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Checkbox solo bajo stock */}
            <label className="flex items-center gap-2 cursor-pointer bg-marfil border border-kraft px-3 py-2 rounded-lg text-xs font-semibold text-chocolate">
              <input
                type="checkbox"
                checked={soloBajoStock}
                onChange={(e) => setSoloBajoStock(e.target.checked)}
                className="rounded text-borgona focus:ring-borgona"
              />
              <span className="flex items-center gap-1 text-estado-error">
                <AlertTriangle className="w-3.5 h-3.5" /> Solo Stock Bajo
              </span>
            </label>

            <button
              onClick={abrirHistorialMovimientos}
              className="flex items-center gap-1.5 bg-marfil hover:bg-crema border border-kraft px-3 py-2 rounded-lg text-xs font-semibold text-chocolate transition-colors"
            >
              <History className="w-4 h-4 text-dorado" />
              <span>Kardex / Historial</span>
            </button>
          </div>

          <button
            onClick={abrirModalCrear}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Material</span>
          </button>
        </div>

        {/* Tabla de Materiales */}
        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Material / Insumo</th>
                <th className="py-3 px-4 text-center">Unidad</th>
                <th className="py-3 px-4 text-right">Stock Actual</th>
                <th className="py-3 px-4 text-right">Stock Mínimo</th>
                <th className="py-3 px-4 text-right">Último Costo</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4 text-center">Alerta</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cacao">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-borgona" />
                    Cargando inventario...
                  </td>
                </tr>
              ) : materialesFiltrados.length > 0 ? (
                materialesFiltrados.map((m) => (
                  <tr key={m.id} className="hover:bg-crema/30">
                    <td className="py-3 px-4 font-semibold text-chocolate">{m.nombre}</td>
                    <td className="py-3 px-4 text-center text-cacao font-mono text-xs">
                      {m.unidad_medida}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-chocolate">
                      {m.stock_actual}
                    </td>
                    <td className="py-3 px-4 text-right text-cacao">{m.stock_minimo}</td>
                    <td className="py-3 px-4 text-right font-medium text-borgona">
                      {formatCordoba(m.costo_unitario)}
                    </td>
                    <td className="py-3 px-4 text-xs text-cacao">
                      {m.proveedor?.nombre || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.bajo_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBEBEA] text-estado-error border border-estado-error/30">
                          <AlertTriangle className="w-3 h-3" /> Faltan {m.faltante}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3E6] text-estado-exito">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirModalAjustar(m)}
                          className="p-1.5 text-dorado hover:text-dorado-dark hover:bg-crema rounded-lg"
                          title="Ajuste manual (merma, corrección)"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirModalEditar(m)}
                          className="p-1.5 text-cacao hover:text-borgona hover:bg-crema rounded-lg"
                          title="Editar material"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-cacao italic">
                    No hay materiales que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Material */}
      <Modal
        isOpen={modalMaterialOpen}
        onClose={() => setModalMaterialOpen(false)}
        title={editId ? "Editar Material" : "Nuevo Material"}
      >
        <form onSubmit={handleGuardarMaterial} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Nombre del Insumo / Material *
            </label>
            <input
              type="text"
              required
              value={formMaterial.nombre}
              onChange={(e) =>
                setFormMaterial({ ...formMaterial, nombre: e.target.value })
              }
              placeholder="Ej. Cinta satinada 2.5cm, Foami escarchado..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Unidad de Medida *
              </label>
              <select
                value={formMaterial.unidad_medida}
                onChange={(e) =>
                  setFormMaterial({ ...formMaterial, unidad_medida: e.target.value })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                <option value="unidad">Unidad</option>
                <option value="metro">Metro</option>
                <option value="pliego">Pliego</option>
                <option value="gramo">Gramo</option>
                <option value="litro">Litro</option>
                <option value="rollo">Rollo</option>
                <option value="caja">Caja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Proveedor Habitual
              </label>
              <select
                value={formMaterial.proveedor_id || ""}
                onChange={(e) =>
                  setFormMaterial({
                    ...formMaterial,
                    proveedor_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                <option value="">Sin proveedor asignado</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Stock Actual
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formMaterial.stock_actual}
                onChange={(e) =>
                  setFormMaterial({
                    ...formMaterial,
                    stock_actual: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formMaterial.stock_minimo}
                onChange={(e) =>
                  setFormMaterial({
                    ...formMaterial,
                    stock_minimo: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Costo Unitario (C$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formMaterial.costo_unitario}
                onChange={(e) =>
                  setFormMaterial({
                    ...formMaterial,
                    costo_unitario: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalMaterialOpen(false)}
              className="px-4 py-2 border border-kraft rounded-lg text-sm font-semibold text-chocolate hover:bg-crema"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm"
            >
              Guardar Material
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajuste Manual de Inventario */}
      <Modal
        isOpen={modalAjusteOpen}
        onClose={() => setModalAjusteOpen(false)}
        title={`Ajuste de Inventario: ${ajusteMaterial?.nombre}`}
      >
        <form onSubmit={handleGuardarAjuste} className="space-y-4">
          <p className="text-xs text-cacao">
            Stock actual:{" "}
            <strong>
              {ajusteMaterial?.stock_actual} {ajusteMaterial?.unidad_medida}
            </strong>
          </p>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Motivo del Movimiento
            </label>
            <select
              value={formAjuste.tipo}
              onChange={(e) => setFormAjuste({ ...formAjuste, tipo: e.target.value })}
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            >
              <option value="ajuste">Ajuste de Conteo Físico</option>
              <option value="merma">Merma o Desperdicio (Salida)</option>
              <option value="consumo_produccion">Consumo en Taller (Salida)</option>
              <option value="devolucion">Devolución / Entrada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Cantidad a Modificar (+ o -)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formAjuste.cantidad}
              onChange={(e) =>
                setFormAjuste({
                  ...formAjuste,
                  cantidad: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Ej. -2 para restar 2 mermas, 5 para sumar"
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
            <p className="text-[11px] text-cacao mt-1">
              Usa número negativo para salida (ej. -3) o positivo para entrada (ej. 5).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Observaciones / Justificación
            </label>
            <textarea
              rows={2}
              value={formAjuste.notas}
              onChange={(e) => setFormAjuste({ ...formAjuste, notas: e.target.value })}
              placeholder="Ej. Material dañado por humedad..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalAjusteOpen(false)}
              className="px-4 py-2 border border-kraft rounded-lg text-sm font-semibold text-chocolate hover:bg-crema"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm"
            >
              Aplicar Ajuste
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Historial de Movimientos (Kardex) */}
      <Modal
        isOpen={modalMovimientosOpen}
        onClose={() => setModalMovimientosOpen(false)}
        title="Historial de Movimientos de Inventario (Kardex)"
        maxWidth="max-w-4xl"
      >
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left text-xs">
            <thead className="bg-crema/70 border-b border-kraft/60 text-cacao uppercase font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3 text-right">Cantidad</th>
                <th className="py-2.5 px-3">Referencia</th>
                <th className="py-2.5 px-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft/30">
              {movimientos.length > 0 ? (
                movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-crema/30">
                    <td className="py-2 px-3 text-cacao">
                      {new Date(mov.fecha).toLocaleString("es-NI")}
                    </td>
                    <td className="py-2 px-3 font-semibold text-chocolate">
                      {mov.material?.nombre}
                    </td>
                    <td className="py-2 px-3 uppercase font-bold text-[10px] text-dorado-dark">
                      {mov.tipo}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        Number(mov.cantidad) >= 0 ? "text-estado-exito" : "text-estado-error"
                      }`}
                    >
                      {Number(mov.cantidad) > 0 ? `+${mov.cantidad}` : mov.cantidad}{" "}
                      {mov.material?.unidad_medida}
                    </td>
                    <td className="py-2 px-3 text-cacao font-mono">{mov.referencia || "—"}</td>
                    <td className="py-2 px-3 text-cacao">{mov.notas || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-cacao italic">
                    Sin movimientos registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

