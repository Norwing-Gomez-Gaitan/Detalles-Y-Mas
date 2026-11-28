"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ExportDropdown } from "@/components/ExportDropdown";
import { formatCordoba, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Receipt, Plus, Trash2, Loader2, DollarSign } from "lucide-react";

export default function AdminGastosPage() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    tipo: "transporte",
    descripcion: "",
    monto: 0,
    pedido_id: null as number | null,
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [gastosRes, pedidosRes] = await Promise.all([
        apiFetch("/api/admin/gastos"),
        apiFetch("/api/admin/pedidos"),
      ]);
      setGastos(gastosRes);
      setPedidos(pedidosRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModal = () => {
    setForm({
      fecha: new Date().toISOString().split("T")[0],
      tipo: "transporte",
      descripcion: "",
      monto: 100,
      pedido_id: null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch("/api/admin/gastos", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al registrar gasto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este gasto?")) return;
    try {
      await apiFetch(`/api/admin/gastos/${id}`, { method: "DELETE" });
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al eliminar gasto");
    }
  };

  const gastosFiltrados = gastos.filter((g) => {
    return filtroTipo ? g.tipo === filtroTipo : true;
  });

  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto), 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Control de Gastos Operativos" />

      <div className="p-8 space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="bg-marfil border border-kraft rounded-lg py-2 px-3 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            >
              <option value="">Todos los Tipos de Gasto</option>
              <option value="transporte">Transporte / Encomienda</option>
              <option value="empaque">Empaque y Bolsas</option>
              <option value="publicidad">Publicidad y Marketing</option>
              <option value="servicios">Servicios Básicos / Taller</option>
              <option value="herramientas">Herramientas</option>
              <option value="otro">Otros</option>
            </select>

            <span className="text-xs font-bold text-cacao bg-marfil px-3 py-2 rounded-lg border border-kraft">
              Total: <strong className="text-borgona">{formatCordoba(totalGastos)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ExportDropdown tipo="gastos" label="Exportar Gastos" />

            <button
              onClick={abrirModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-semibold px-4 py-2 rounded-lg shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>

        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Asociado a Pedido</th>
                <th className="py-3 px-4 text-right">Monto (C$)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-cacao">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-borgona" />
                    Cargando gastos...
                  </td>
                </tr>
              ) : gastosFiltrados.length > 0 ? (
                gastosFiltrados.map((g) => (
                  <tr key={g.id} className="hover:bg-crema/30">
                    <td className="py-3 px-4 text-cacao">{formatDate(g.fecha)}</td>
                    <td className="py-3 px-4 uppercase font-bold text-xs text-dorado-dark">
                      {g.tipo}
                    </td>
                    <td className="py-3 px-4 font-medium text-chocolate">{g.descripcion}</td>
                    <td className="py-3 px-4 text-xs text-cacao">
                      {g.pedido ? `Pedido #${g.pedido.id} (${g.pedido.cliente?.nombre})` : "General"}
                    </td>
                    <td className="py-3 px-4 text-right font-serif font-bold text-estado-error">
                      -{formatCordoba(g.monto)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleEliminar(g.id)}
                        className="p-1.5 text-cacao hover:text-estado-error hover:bg-rosa-soft rounded-lg"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-cacao italic">
                    Sin gastos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Nuevo Gasto"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Tipo de Gasto *
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                <option value="transporte">Transporte / Encomienda</option>
                <option value="empaque">Empaque y Bolsas</option>
                <option value="publicidad">Publicidad y Redes Sociales</option>
                <option value="servicios">Servicios Básicos / Taller</option>
                <option value="herramientas">Herramientas</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Descripción del Gasto *
            </label>
            <input
              type="text"
              required
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej. Combustible delivery, Bolsas con logo..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Monto (C$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.monto}
                onChange={(e) =>
                  setForm({ ...form, monto: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Asociar a Pedido (Opcional)
              </label>
              <select
                value={form.pedido_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pedido_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                <option value="">Gasto General del Negocio</option>
                {pedidos.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pedido #{p.id} - {p.cliente?.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-kraft rounded-lg text-sm font-semibold text-chocolate hover:bg-crema"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm"
            >
              {submitting ? "Guardando..." : "Guardar Gasto"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

