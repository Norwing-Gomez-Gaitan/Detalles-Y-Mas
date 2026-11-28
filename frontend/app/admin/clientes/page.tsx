"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ExportDropdown } from "@/components/ExportDropdown";
import { formatCordoba, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Calendar,
  Gift,
  Phone,
  Mail,
  MapPin,
  Edit,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");

  // Modal cliente
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    whatsapp: "",
    email: "",
    direccion: "",
    red_social: "",
    fecha_especial: "",
    notas: "",
  });

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admin/clientes");
      setClientes(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const abrirModalCrear = () => {
    setEditId(null);
    setForm({
      nombre: "",
      telefono: "",
      whatsapp: "505",
      email: "",
      direccion: "",
      red_social: "",
      fecha_especial: "",
      notas: "",
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (c: any) => {
    setEditId(c.id);
    setForm({
      nombre: c.nombre,
      telefono: c.telefono || "",
      whatsapp: c.whatsapp || "",
      email: c.email || "",
      direccion: c.direccion || "",
      red_social: c.red_social || "",
      fecha_especial: c.fecha_especial
        ? new Date(c.fecha_especial).toISOString().split("T")[0]
        : "",
      notas: c.notas || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const endpoint = editId ? `/api/admin/clientes/${editId}` : "/api/admin/clientes";
      const method = editId ? "PUT" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(form),
      });

      setModalOpen(false);
      cargarClientes();
    } catch (err: any) {
      alert(err.message || "Error al guardar cliente");
    } finally {
      setSubmitting(false);
    }
  };

  const clientesProximos = clientes.filter((c) => c.es_fecha_proxima);
  const clientesFiltrados = clientes.filter((c) => {
    return (
      c.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      (c.whatsapp && c.whatsapp.includes(buscar)) ||
      (c.telefono && c.telefono.includes(buscar))
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Directorio y CRM de Clientes" />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* Banner de Recordatorios de Fechas Especiales Próximas */}
        {clientesProximos.length > 0 && (
          <div className="bg-rosa-soft/60 border border-rosa-pastel rounded-artesanal p-4 space-y-2">
            <div className="flex items-center gap-2 text-borgona font-bold text-sm">
              <Gift className="w-4 h-4 text-borgona" />
              <span>Recordatorios de Fechas Especiales Próximas (Próximos 15 días)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {clientesProximos.map((cp) => (
                <div
                  key={cp.id}
                  className="bg-marfil p-3 rounded-lg border border-rosa-pastel/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-chocolate block">{cp.nombre}</span>
                    <span className="text-cacao flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-dorado" />
                      {formatDate(cp.fecha_especial)} (en {cp.dias_para_fecha} días)
                    </span>
                  </div>
                  {cp.whatsapp && (
                    <a
                      href={`https://wa.me/${cp.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `¡Hola ${cp.nombre}! Te saludamos de Detalles y Más. Notamos que se acerca tu fecha especial y queremos ofrecerte opciones únicas para celebrarlo.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-borgona hover:bg-borgona-dark text-white rounded-full transition-colors"
                      title="Enviar felicitación o promo por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-dorado" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de Filtros y Botón */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-cacao absolute left-3 top-3.5" />
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por nombre, teléfono o WhatsApp..."
              className="w-full pl-9 pr-3 py-2 bg-marfil border border-kraft rounded-lg text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ExportDropdown tipo="clientes" label="Exportar Clientes" />

            <button
              onClick={abrirModalCrear}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-semibold px-4 py-2 rounded-lg shadow-sm text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Tabla de Clientes */}
        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">WhatsApp / Teléfono</th>
                <th className="py-3 px-4">Red Social</th>
                <th className="py-3 px-4">Fecha Especial</th>
                <th className="py-3 px-4 text-center">Pedidos</th>
                <th className="py-3 px-4 text-right">Total Comprado (C$)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-cacao">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-borgona" />
                    Cargando clientes...
                  </td>
                </tr>
              ) : clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-crema/30">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-chocolate">{c.nombre}</div>
                      {c.direccion && (
                        <div className="text-[11px] text-cacao flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-kraft" /> {c.direccion}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.whatsapp ? (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-estado-exito hover:underline text-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{c.whatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-cacao">{c.telefono || "—"}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-cacao">
                      {c.red_social || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {c.fecha_especial ? (
                        <span className="flex items-center gap-1 text-chocolate font-medium">
                          <Calendar className="w-3 h-3 text-dorado" />
                          {formatDate(c.fecha_especial)}
                        </span>
                      ) : (
                        <span className="text-cacao">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-chocolate">
                      {c.pedidos_count}
                    </td>
                    <td className="py-3 px-4 text-right font-serif font-bold text-borgona">
                      {formatCordoba(c.total_comprado)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => abrirModalEditar(c)}
                        className="p-1.5 text-cacao hover:text-borgona hover:bg-crema rounded-lg"
                        title="Editar cliente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-cacao italic">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Cliente */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Editar Datos del Cliente" : "Registrar Nuevo Cliente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Valeria Chamorro..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="50584856722"
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="8485-6722"
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Usuario Red Social (IG / FB)
              </label>
              <input
                type="text"
                value={form.red_social}
                onChange={(e) => setForm({ ...form, red_social: e.target.value })}
                placeholder="@usuario"
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Fecha Especial (Cumpleaños / Aniversario)
              </label>
              <input
                type="date"
                value={form.fecha_especial}
                onChange={(e) => setForm({ ...form, fecha_especial: e.target.value })}
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Dirección de Entrega Frecuente
            </label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Barrio, reparto o punto de referencia en Nicaragua..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Notas y Preferencias del Cliente
            </label>
            <textarea
              rows={2}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Ej. Le gustan las rosas borgoña, cliente puntual..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
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
              {submitting ? "Guardando..." : "Guardar Cliente"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

