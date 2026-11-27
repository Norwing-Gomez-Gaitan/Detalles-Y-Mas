"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { formatCordoba } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Receipt,
  Loader2,
} from "lucide-react";

export default function AdminReportesPage() {
  const [reportes, setReportes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/reportes")
      .then((res) => setReportes(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDescargarCsv = (tipo: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    const url = `${backendUrl}/api/admin/reportes/exportar-csv?tipo=${tipo}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Reportes y Métricas Financieras" />

      <div className="p-8 space-y-8 max-w-7xl">
        {/* Encabezado con Botones de Exportar CSV */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cacao">
            Monitorea el rendimiento mensual de ventas, productos estrella y distribución de gastos.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDescargarCsv("pedidos")}
              className="flex items-center gap-2 bg-marfil hover:bg-crema border border-kraft text-chocolate font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-dorado" />
              <span>Exportar Pedidos (CSV)</span>
            </button>
            <button
              onClick={() => handleDescargarCsv("materiales")}
              className="flex items-center gap-2 bg-marfil hover:bg-crema border border-kraft text-chocolate font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-dorado" />
              <span>Exportar Inventario (CSV)</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-cacao">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-borgona" />
            Cargando reportes consolidados...
          </div>
        ) : (
          <>
            {/* 1. Resumen Mensual (Ventas vs Costo vs Ganancia) */}
            <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
                <Calendar className="w-5 h-5 text-dorado" />
                Ventas y Ganancia por Mes (Pedidos Entregados)
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Mes</th>
                      <th className="py-2.5 px-3 text-center">Pedidos</th>
                      <th className="py-2.5 px-3 text-right">Ventas Totales</th>
                      <th className="py-2.5 px-3 text-right">Costo Estimado</th>
                      <th className="py-2.5 px-3 text-right">Ganancia Bruta</th>
                      <th className="py-2.5 px-3 text-right">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kraft/30">
                    {reportes?.resumenMensual?.length > 0 ? (
                      reportes.resumenMensual.map((m: any, idx: number) => {
                        const ventas = Number(m.ventas || 0);
                        const costo = Number(m.costo_estimado || 0);
                        const ganancia = Number(m.ganancia_bruta || 0);
                        const margen = ventas > 0 ? ((ganancia / ventas) * 100).toFixed(1) : 0;
                        return (
                          <tr key={idx} className="hover:bg-crema/30 font-medium">
                            <td className="py-2.5 px-3 font-semibold text-chocolate">
                              {new Date(m.mes).toLocaleDateString("es-NI", {
                                month: "long",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-chocolate">
                              {m.pedidos}
                            </td>
                            <td className="py-2.5 px-3 text-right text-chocolate">
                              {formatCordoba(ventas)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-cacao">
                              {formatCordoba(costo)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-estado-exito">
                              +{formatCordoba(ganancia)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-dorado-dark">
                              {margen}%
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-cacao italic">
                          Aún no hay meses con pedidos marcados como entregados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dos Columnas: Gastos por Tipo y Clientes Frecuentes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Distribución de Gastos */}
              <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-estado-error" />
                  Gastos Operativos por Categoría
                </h2>

                <div className="space-y-3">
                  {reportes?.gastosPorTipo?.length > 0 ? (
                    reportes.gastosPorTipo.map((g: any) => (
                      <div key={g.tipo} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="uppercase text-chocolate">{g.tipo}</span>
                          <span className="text-estado-error">{formatCordoba(g.total)}</span>
                        </div>
                        <div className="w-full bg-crema h-2 rounded-full overflow-hidden border border-kraft/40">
                          <div
                            className="bg-borgona h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(10, (g.total / 1000) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-cacao italic text-center py-4">
                      Sin gastos registrados.
                    </p>
                  )}
                </div>
              </div>

              {/* Clientes Frecuentes Top */}
              <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
                  <Users className="w-5 h-5 text-dorado" />
                  Clientes Más Frecuentes
                </h2>

                <div className="divide-y divide-kraft/40 text-xs">
                  {reportes?.clientesTop?.length > 0 ? (
                    reportes.clientesTop.map((c: any) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <strong className="text-chocolate block">{c.nombre}</strong>
                          <span className="text-cacao">
                            {c.pedidos_count} pedidos completados
                          </span>
                        </div>
                        <div className="font-serif font-bold text-borgona text-sm">
                          {formatCordoba(c.total_comprado)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-cacao italic text-center py-4">
                      Aún no hay historial de clientes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

