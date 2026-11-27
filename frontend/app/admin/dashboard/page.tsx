"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { Badge } from "@/components/Badge";
import { formatCordoba, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  ShoppingBag,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Package,
  Boxes,
  Loader2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/dashboard")
      .then((res) => setData(res))
      .catch((err) => console.error("Error al cargar dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Dashboard Principal" />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-borgona mx-auto" />
            <p className="text-sm font-medium text-cacao">
              Cargando métricas y datos del negocio...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    pedidosActivos: 0,
    entregasSemana: 0,
    saldoPorCobrar: 0,
    ventasMes: 0,
    gananciaMes: 0,
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Dashboard Principal" />

      <div className="p-8 space-y-8 max-w-7xl">
        {/* Tarjetas de Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Pedidos Activos */}
          <div className="bg-marfil dark:bg-artesanoDark-surface p-5 rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-borgona">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-artesanoDark-muted">
                Pedidos Activos
              </span>
              <div className="w-8 h-8 rounded-full bg-rosa-soft dark:bg-borgona/25 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-borgona dark:text-rosa-pastel" />
              </div>
            </div>
            <div className="text-2xl font-bold font-serif text-chocolate dark:text-artesanoDark-text">
              {kpis.pedidosActivos}
            </div>
            <p className="text-[11px] text-cacao dark:text-artesanoDark-muted">En producción o listos</p>
          </div>

          {/* 2. Entregas de la Semana */}
          <div className="bg-marfil dark:bg-artesanoDark-surface p-5 rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-dorado">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-artesanoDark-muted">
                Entregas Semana
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FFF8E7] dark:bg-dorado/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-dorado" />
              </div>
            </div>
            <div className="text-2xl font-bold font-serif text-chocolate dark:text-artesanoDark-text">
              {kpis.entregasSemana}
            </div>
            <p className="text-[11px] text-cacao dark:text-artesanoDark-muted">Próximos 7 días</p>
          </div>

          {/* 3. Saldo por Cobrar */}
          <div className="bg-marfil dark:bg-artesanoDark-surface p-5 rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-estado-error">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-artesanoDark-muted">
                Por Cobrar
              </span>
              <div className="w-8 h-8 rounded-full bg-rosa-soft/40 dark:bg-estado-error/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-estado-error" />
              </div>
            </div>
            <div className="text-xl font-bold font-serif text-estado-error">
              {formatCordoba(kpis.saldoPorCobrar)}
            </div>
            <p className="text-[11px] text-cacao dark:text-artesanoDark-muted">Saldos pendientes</p>
          </div>

          {/* 4. Ventas del Mes */}
          <div className="bg-marfil dark:bg-artesanoDark-surface p-5 rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-estado-exito">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-artesanoDark-muted">
                Ventas del Mes
              </span>
              <div className="w-8 h-8 rounded-full bg-[#EAF3E6] dark:bg-estado-exito/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-estado-exito" />
              </div>
            </div>
            <div className="text-xl font-bold font-serif text-chocolate dark:text-artesanoDark-text">
              {formatCordoba(kpis.ventasMes)}
            </div>
            <p className="text-[11px] text-cacao dark:text-artesanoDark-muted">Entregados este mes</p>
          </div>

          {/* 5. Ganancia Estimada del Mes */}
          <div className="bg-marfil dark:bg-artesanoDark-surface p-5 rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-borgona">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao dark:text-artesanoDark-muted">
                Ganancia Estimada
              </span>
              <div className="w-8 h-8 rounded-full bg-rosa-soft dark:bg-borgona/25 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-borgona dark:text-rosa-pastel" />
              </div>
            </div>
            <div className="text-xl font-bold font-serif text-borgona dark:text-rosa-pastel">
              {formatCordoba(kpis.gananciaMes)}
            </div>
            <p className="text-[11px] text-cacao dark:text-artesanoDark-muted">Menos costo estimado</p>
          </div>
        </div>

        {/* Dos Columnas de Tablas: Próximas Entregas y Materiales por Reponer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Próximas Entregas (v_pedidos_pendientes) */}
          <div className="bg-marfil dark:bg-artesanoDark-surface rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-chocolate dark:text-artesanoDark-text flex items-center gap-2">
                <Calendar className="w-5 h-5 text-dorado" />
                Próximas Entregas
              </h2>
              <Link
                href="/admin/pedidos"
                className="text-xs font-bold text-borgona dark:text-rosa-pastel hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-crema/60 dark:bg-artesanoDark-card border-b border-kraft/50 dark:border-artesanoDark-border text-cacao dark:text-artesanoDark-muted uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Entrega</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kraft/20 dark:divide-artesanoDark-border">
                  {data?.pedidosPendientes?.length > 0 ? (
                    data.pedidosPendientes.map((ped: any) => (
                      <tr key={ped.pedido_id} className="hover:bg-crema/40 dark:hover:bg-artesanoDark-hover transition-colors">
                        <td className="py-3 px-3 font-bold text-borgona dark:text-rosa-pastel">#{ped.pedido_id}</td>
                        <td className="py-3 px-3 font-medium text-chocolate dark:text-artesanoDark-text">{ped.cliente}</td>
                        <td className="py-3 px-3 text-cacao dark:text-artesanoDark-muted">{formatDate(ped.fecha_entrega)}</td>
                        <td className="py-3 px-3">
                          <Badge variant={ped.estado as any}>{ped.estado}</Badge>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-estado-error">
                          {formatCordoba(ped.saldo)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-cacao dark:text-artesanoDark-muted italic text-sm">
                        No hay entregas pendientes registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Materiales por Reponer — tabla con buen espaciado y soporte dark mode */}
          <div className="bg-marfil dark:bg-artesanoDark-surface rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-chocolate dark:text-artesanoDark-text flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-estado-aviso" />
                Materiales por Reponer
              </h2>
              <Link
                href="/admin/inventario"
                className="text-xs font-bold text-borgona dark:text-rosa-pastel hover:underline flex items-center gap-1"
              >
                Ver inventario <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-crema/60 dark:bg-artesanoDark-card border-b border-kraft/50 dark:border-artesanoDark-border text-cacao dark:text-artesanoDark-muted uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3 px-4 rounded-tl-lg">Material</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Stock Actual</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Stock Mínimo</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Faltante</th>
                    <th className="py-3 px-4 rounded-tr-lg">Proveedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kraft/20 dark:divide-artesanoDark-border">
                  {data?.materialesPorReponer?.length > 0 ? (
                    data.materialesPorReponer.map((mat: any) => (
                      <tr key={mat.id} className="hover:bg-crema/40 dark:hover:bg-artesanoDark-hover transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-chocolate dark:text-artesanoDark-text">
                          {mat.nombre}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-estado-error bg-estado-error/10 dark:bg-estado-error/20 px-2.5 py-1 rounded-full text-xs">
                            {mat.stock_actual} <span className="font-normal opacity-70">{mat.unidad_medida}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-cacao dark:text-artesanoDark-muted bg-kraft/20 dark:bg-artesanoDark-card px-2.5 py-1 rounded-full text-xs font-medium">
                            {mat.stock_minimo} <span className="font-normal opacity-70">{mat.unidad_medida}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-estado-aviso bg-estado-aviso/10 dark:bg-estado-aviso/20 px-2.5 py-1 rounded-full text-xs">
                            ↑ {mat.faltante} <span className="font-normal opacity-70">{mat.unidad_medida}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-sm text-cacao dark:text-artesanoDark-muted">
                          {mat.proveedor || <span className="text-kraft dark:text-artesanoDark-border italic">Sin proveedor</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-estado-exito font-medium italic text-sm">
                        ✓ ¡Inventario al día! Ningún material bajo stock mínimo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fila Inferior: Productos más vendidos — rediseño con soporte dark mode */}
        <div className="bg-marfil dark:bg-artesanoDark-surface rounded-artesanal border border-kraft/70 dark:border-artesanoDark-border shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-chocolate dark:text-artesanoDark-text flex items-center gap-2">
              <Package className="w-5 h-5 text-borgona dark:text-rosa-pastel" />
              Productos Más Vendidos
            </h2>
            <Link
              href="/admin/reportes"
              className="text-xs font-bold text-borgona dark:text-rosa-pastel hover:underline flex items-center gap-1"
            >
              Ver reporte detallado <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.productosMasVendidos?.length > 0 ? (
              data.productosMasVendidos.slice(0, 3).map((prod: any, idx: number) => {
                const medalColores = [
                  "from-dorado/20 to-dorado/5 border-dorado/40 dark:from-dorado/15 dark:to-dorado/5 dark:border-dorado/30",
                  "from-kraft/40 to-kraft/10 border-kraft dark:from-artesanoDark-hover dark:to-artesanoDark-card dark:border-artesanoDark-border",
                  "from-crema to-marfil border-kraft/50 dark:from-artesanoDark-card dark:to-artesanoDark-surface dark:border-artesanoDark-border",
                ];
                const posColores = ["text-dorado", "text-cacao dark:text-artesanoDark-muted", "text-cacao/70 dark:text-artesanoDark-muted/70"];
                const medalEmoji = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={prod.id}
                    className={`bg-gradient-to-br ${medalColores[idx]} border rounded-artesanal p-5 flex flex-col gap-3 shadow-xs`}
                  >
                    {/* Encabezado con medalla y posición */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-extrabold uppercase tracking-widest ${posColores[idx]}`}>
                        {medalEmoji[idx]} Top #{idx + 1}
                      </span>
                      {prod.ingresos > 0 && (
                        <span className="text-[10px] font-bold text-estado-exito bg-estado-exito/10 dark:bg-estado-exito/20 px-2 py-0.5 rounded-full">
                          Vendedor
                        </span>
                      )}
                    </div>

                    {/* Nombre del producto */}
                    <h3 className="font-serif font-bold text-sm text-chocolate dark:text-artesanoDark-text leading-snug line-clamp-2">
                      {prod.nombre}
                    </h3>

                    {/* Métricas de rendimiento */}
                    <div className="flex items-end justify-between pt-1 border-t border-kraft/30 dark:border-artesanoDark-border">
                      <div className="text-left">
                        <p className="text-[10px] text-cacao dark:text-artesanoDark-muted uppercase font-bold tracking-wide">Unidades</p>
                        <p className="text-lg font-bold font-serif text-chocolate dark:text-artesanoDark-text leading-tight">
                          {prod.unidades}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-cacao dark:text-artesanoDark-muted uppercase font-bold tracking-wide">Ingresos</p>
                        <p className={`text-base font-bold font-serif leading-tight ${prod.ingresos > 0 ? "text-borgona dark:text-rosa-pastel" : "text-cacao dark:text-artesanoDark-muted"}`}>
                          {formatCordoba(prod.ingresos)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-8 text-sm text-cacao dark:text-artesanoDark-muted italic">
                Aún no hay suficientes ventas para generar el ranking.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

