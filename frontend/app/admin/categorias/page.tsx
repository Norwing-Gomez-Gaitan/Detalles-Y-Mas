"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";
import { Layers, Plus, Edit, Loader2 } from "lucide-react";

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", activa: true });
  const [submitting, setSubmitting] = useState(false);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admin/categorias");
      setCategorias(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const abrirModalCrear = () => {
    setEditId(null);
    setForm({ nombre: "", descripcion: "", activa: true });
    setModalOpen(true);
  };

  const abrirModalEditar = (c: any) => {
    setEditId(c.id);
    setForm({ nombre: c.nombre, descripcion: c.descripcion || "", activa: c.activa });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const endpoint = editId ? `/api/admin/categorias/${editId}` : "/api/admin/categorias";
      const method = editId ? "PUT" : "POST";

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(form),
      });

      setModalOpen(false);
      cargarCategorias();
    } catch (err: any) {
      alert(err.message || "Error al guardar categoría");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Categorías de Catálogo" />

      <div className="p-8 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-cacao">
            Organiza los productos en secciones temáticas para el sitio público.
          </p>
          <button
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>

        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-center">Productos</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kraft/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-cacao">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-borgona" />
                    Cargando categorías...
                  </td>
                </tr>
              ) : categorias.map((c) => (
                <tr key={c.id} className="hover:bg-crema/30">
                  <td className="py-3 px-4 font-semibold text-chocolate">{c.nombre}</td>
                  <td className="py-3 px-4 text-cacao text-xs">{c.descripcion || "—"}</td>
                  <td className="py-3 px-4 text-center font-bold text-borgona">
                    {c._count?.productos ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.activa
                          ? "bg-[#EAF3E6] text-estado-exito"
                          : "bg-crema text-cacao"
                      }`}
                    >
                      {c.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => abrirModalEditar(c)}
                      className="p-1.5 text-cacao hover:text-borgona hover:bg-crema rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Editar Categoría" : "Nueva Categoría"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Arreglos Florales, Sweet 15..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Descripción
            </label>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cat_activa"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="rounded text-borgona focus:ring-borgona w-4 h-4"
            />
            <label htmlFor="cat_activa" className="text-sm font-medium text-chocolate cursor-pointer">
              Categoría Activa
            </label>
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
              {submitting ? "Guardando..." : "Guardar Categoría"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

