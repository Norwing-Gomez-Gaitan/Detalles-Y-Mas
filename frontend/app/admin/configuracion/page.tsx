"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { apiFetch } from "@/lib/api";
import { Settings, Save, Lock, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const defaultConfig = {
  nombre: "Detalles y Más",
  lema: "Hecho con amor para cada ocasión",
  telefono: "8485-6722",
  whatsapp: "8485-6722",
  instagram: "@detallesymas.ni",
  facebook: "https://www.facebook.com/Aracelly82",
  direccion_cobertura: "Km8 carretera norte entrada Rocargo 4c al Norte 2 abajo media al sur",
  horario: "Lunes a Sábado: 8:00 AM - 6:00 PM",
  sobre_nosotros:
    "Somos un taller de manualidades y detalles personalizados en Nicaragua. Elaboramos arreglos, adornos y recuerdos únicos hechos a mano con pasión y amor para cada ocasión especial.",
};

export default function AdminConfiguracionPage() {
  const [config, setConfig] = useState<any>(defaultConfig);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [mensajeConfig, setMensajeConfig] = useState<string | null>(null);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);

  // Formulario cambio de contraseña
  const [passActual, setPassActual] = useState("");
  const [passNuevo, setPassNuevo] = useState("");
  const [mensajePass, setMensajePass] = useState<string | null>(null);
  const [errorPass, setErrorPass] = useState<string | null>(null);
  const [guardandoPass, setGuardandoPass] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setErrorConfig(null);

      // Cargar configuración de forma protegida
      try {
        const confRes = await apiFetch("/api/admin/configuracion");
        if (confRes && typeof confRes === "object") {
          setConfig((prev: any) => ({
            ...prev,
            ...confRes,
            // Asegurar que si facebook no está definido o es el demo, tenga la URL real
            facebook: confRes.facebook || "https://www.facebook.com/Aracelly82",
          }));
        }
      } catch (err: any) {
        console.warn("No se pudo conectar con la API de configuración:", err);
      }

      // Cargar usuarios
      try {
        const usersRes = await apiFetch("/api/admin/usuarios");
        if (Array.isArray(usersRes)) {
          setUsuarios(usersRes);
        }
      } catch (err: any) {
        console.warn("No se pudo obtener la lista de usuarios:", err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardandoConfig(true);
      setMensajeConfig(null);
      setErrorConfig(null);

      const res = await apiFetch("/api/admin/configuracion", {
        method: "PUT",
        body: JSON.stringify(config),
      });

      if (res && typeof res === "object") {
        setConfig((prev: any) => ({ ...prev, ...res }));
      }
      setMensajeConfig("¡Información del negocio guardada exitosamente!");
      setTimeout(() => setMensajeConfig(null), 4000);
    } catch (err: any) {
      setErrorConfig(err.message || "Error al guardar configuración. Comprueba que el backend esté corriendo.");
    } finally {
      setGuardandoConfig(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardandoPass(true);
      setErrorPass(null);
      setMensajePass(null);
      await apiFetch("/api/admin/usuarios/cambiar-password", {
        method: "POST",
        body: JSON.stringify({
          password_actual: passActual,
          password_nuevo: passNuevo,
        }),
      });
      setMensajePass("¡Contraseña actualizada con éxito!");
      setPassActual("");
      setPassNuevo("");
      setTimeout(() => setMensajePass(null), 4000);
    } catch (err: any) {
      setErrorPass(err.message || "Error al cambiar contraseña");
    } finally {
      setGuardandoPass(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Configuración del Negocio" />
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-borgona" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Configuración del Negocio y Sistema" />

      <div className="p-8 space-y-8 max-w-5xl">
        {/* Formulario de Información del Negocio (Alimenta el Sitio Público) */}
        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-5">
          <div className="border-b border-kraft/50 pb-3">
            <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
              <Settings className="w-5 h-5 text-borgona" />
              Datos Públicos de Detalles y Más
            </h2>
            <p className="text-xs text-cacao">
              Esta información se refleja automáticamente en la portada, catálogo y pie de página del sitio público.
            </p>
          </div>

          {mensajeConfig && (
            <div className="p-3 bg-[#EAF3E6] border border-estado-exito/30 text-estado-exito text-xs rounded-lg flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{mensajeConfig}</span>
            </div>
          )}

          {errorConfig && (
            <div className="p-3 bg-rosa-soft border border-rosa-pastel text-estado-error text-xs rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{errorConfig}</span>
            </div>
          )}

          <form onSubmit={handleGuardarConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  Nombre del Emprendimiento
                </label>
                <input
                  type="text"
                  required
                  value={config?.nombre || ""}
                  onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  Lema Comercial
                </label>
                <input
                  type="text"
                  required
                  value={config?.lema || ""}
                  onChange={(e) => setConfig({ ...config, lema: e.target.value })}
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  WhatsApp Oficial
                </label>
                <input
                  type="text"
                  required
                  value={config?.whatsapp || ""}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  placeholder="8485-6722"
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={config?.telefono || ""}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  placeholder="8485-6722"
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  value={config?.instagram || ""}
                  onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                  placeholder="@detallesymas.ni"
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  Página de Facebook
                </label>
                <input
                  type="text"
                  value={config?.facebook || ""}
                  onChange={(e) => setConfig({ ...config, facebook: e.target.value })}
                  placeholder="https://www.facebook.com/Aracelly82"
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Dirección y Cobertura de Entrega
              </label>
              <input
                type="text"
                value={config?.direccion_cobertura || ""}
                onChange={(e) =>
                  setConfig({ ...config, direccion_cobertura: e.target.value })
                }
                placeholder="Managua, Nicaragua. Envíos y entregas a todo el país..."
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Horario de Atención
              </label>
              <input
                type="text"
                value={config?.horario || ""}
                onChange={(e) => setConfig({ ...config, horario: e.target.value })}
                placeholder="Lunes a Sábado: 8:00 AM - 6:00 PM"
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Texto "Sobre Nosotros" (Historia del Emprendimiento)
              </label>
              <textarea
                rows={4}
                value={config?.sobre_nosotros || ""}
                onChange={(e) =>
                  setConfig({ ...config, sobre_nosotros: e.target.value })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-kraft/40">
              <button
                type="submit"
                disabled={guardandoConfig}
                className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                {guardandoConfig ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Guardar Cambios del Negocio</span>
              </button>
            </div>
          </form>
        </div>

        {/* Cambio de Contraseña y Usuarios Administradores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cambio de Contraseña */}
          <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
              <Lock className="w-5 h-5 text-dorado" />
              Cambiar Contraseña
            </h2>

            {mensajePass && (
              <div className="p-2.5 bg-[#EAF3E6] border border-estado-exito/30 text-estado-exito text-xs rounded-lg font-medium">
                {mensajePass}
              </div>
            )}
            {errorPass && (
              <div className="p-2.5 bg-[#FBEBEA] border border-estado-error/30 text-estado-error text-xs rounded-lg font-medium">
                {errorPass}
              </div>
            )}

            <form onSubmit={handleCambiarPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={passActual}
                  onChange={(e) => setPassActual(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                  Nueva Contraseña (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={passNuevo}
                  onChange={(e) => setPassNuevo(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={guardandoPass}
                  className="w-full bg-borgona hover:bg-borgona-dark text-white font-semibold py-2 rounded-lg text-sm transition-all cursor-pointer"
                >
                  {guardandoPass ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </div>
            </form>
          </div>

          {/* Usuarios Administradores */}
          <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
              <User className="w-5 h-5 text-borgona" />
              Administradores del Sistema
            </h2>

            <div className="divide-y divide-kraft/40 text-xs">
              {usuarios.length > 0 ? (
                usuarios.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <strong className="text-chocolate block text-sm">{u.nombre}</strong>
                      <span className="text-cacao">{u.email}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3E6] text-estado-exito">
                      Activo
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-3 text-cacao italic">
                  admin@detallesymas.ni (Administrador Principal)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
