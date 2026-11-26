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
          <div className="bg-marfil p-5 rounded-artesanal border border-kraft/70 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-borgona">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao">
                Pedidos Activos
              </span>
              <div className="w-8 h-8 rounded-full bg-rosa-soft flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-borgona" />
              </div>
            </div>
            <div className="text-2xl font-bold font-serif text-chocolate">
              {kpis.pedidosActivos}
            </div>
            <p className="text-[11px] text-cacao">En producción o listos</p>
          </div>

          {/* 2. Entregas de la Semana */}
          <div className="bg-marfil p-5 rounded-artesanal border border-kraft/70 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-dorado">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao">
                Entregas Semana
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FFF8E7] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-dorado" />
              </div>
            </div>
            <div className="text-2xl font-bold font-serif text-chocolate">
              {kpis.entregasSemana}
            </div>
            <p className="text-[11px] text-cacao">Próximos 7 días</p>
          </div>

          {/* 3. Saldo por Cobrar */}
          <div className="bg-marfil p-5 rounded-artesanal border border-kraft/70 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-estado-error">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao">
                Por Cobrar
              </span>
              <div className="w-8 h-8 rounded-full bg-rosa-soft/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-estado-error" />
              </div>
            </div>
            <div className="text-xl font-bold font-serif text-estado-error">
              {formatCordoba(kpis.saldoPorCobrar)}
            </div>
            <p className="text-[11px] text-cacao">Saldos pendientes</p>
          </div>

          {/* 4. Ventas del Mes */}
          <div className="bg-marfil p-5 rounded-artesanal border border-kraft/70 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-estado-exito">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao">
                Ventas del Mes
              </span>
              <div className="w-8 h-8 rounded-full bg-[#EAF3E6] flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-estado-exito" />
              </div>
            </div>
            <div className="text-xl font-bold font-serif text-chocolate">
              {formatCordoba(kpis.ventasMes)}
            </div>
            <p className="text-[11px] text-cacao">Entregados este mes</p>
          </div>

          {/* 5. Ganancia Estimada del Mes */}
          <div className="bg-marfil p-5 rounded-artesanal border border-kraft/70 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-borgona">
              <span className="text-xs font-bold uppercase tracking-wider text-cacao">
                Ganancia Estimada
              </span>
              <div className="w-8 h-8 rounded-full bg-rosa-soft flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-borgona" />
              </div>
            </div>
            <div className="text-xl font-bold font-serif text-borgona">
              {formatCordoba(kpis.gananciaMes)}
            </div>
            <p className="text-[11px] text-cacao">Menos costo estimado</p>
          </div>
        </div>

        {/* Dos Columnas de Tablas: Próximas Entregas y Materiales por Reponer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Próximas Entregas (v_pedidos_pendientes) */}
          <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
                <Calendar className="w-5 h-5 text-dorado" />
                Próximas Entregas
              </h2>
              <Link
                href="/admin/pedidos"
                className="text-xs font-bold text-borgona hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-kraft/50 text-cacao uppercase font-bold text-[10px]">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Cliente</th>
                    <th className="py-2.5">Entrega</th>
                    <th className="py-2.5">Estado</th>
                    <th className="py-2.5 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kraft/30">
                  {data?.pedidosPendientes?.length > 0 ? (
                    data.pedidosPendientes.map((ped: any) => (
                      <tr key={ped.pedido_id} className="hover:bg-crema/40">
                        <td className="py-2.5 font-bold text-borgona">#{ped.pedido_id}</td>
                        <td className="py-2.5 font-medium text-chocolate">{ped.cliente}</td>
                        <td className="py-2.5 text-cacao">{formatDate(ped.fecha_entrega)}</td>
                        <td className="py-2.5">
                          <Badge variant={ped.estado as any}>{ped.estado}</Badge>
                        </td>
                        <td className="py-2.5 text-right font-bold text-estado-error">
                          {formatCordoba(ped.saldo)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-cacao italic">
                        No hay entregas pendientes registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Materiales por Reponer (v_materiales_por_reponer) */}
          <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-estado-aviso" />
                Materiales por Reponer
              </h2>
              <Link
                href="/admin/inventario"
                className="text-xs font-bold text-borgona hover:underline flex items-center gap-1"
              >
                Ver inventario <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-kraft/50 text-cacao uppercase font-bold text-[10px]">
                    <th className="py-2.5">Material</th>
                    <th className="py-2.5">Stock</th>
                    <th className="py-2.5">Mínimo</th>
                    <th className="py-2.5">Faltante</th>
                    <th className="py-2.5">Proveedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kraft/30">
                  {data?.materialesPorReponer?.length > 0 ? (
                    data.materialesPorReponer.map((mat: any) => (
                      <tr key={mat.id} className="hover:bg-crema/40">
                        <td className="py-2.5 font-medium text-chocolate">{mat.nombre}</td>
                        <td className="py-2.5 font-bold text-estado-error">
                          {mat.stock_actual} {mat.unidad_medida}
                        </td>
                        <td className="py-2.5 text-cacao">
                          {mat.stock_minimo} {mat.unidad_medida}
                        </td>
                        <td className="py-2.5 font-bold text-estado-aviso">
                          {mat.faltante} {mat.unidad_medida}
                        </td>
                        <td className="py-2.5 text-cacao">{mat.proveedor || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-estado-exito font-medium italic">
                        ¡Inventario al día! Ningún material bajo stock mínimo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fila Inferior: Productos más vendidos */}
        <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-chocolate flex items-center gap-2">
              <Package className="w-5 h-5 text-borgona" />
              Productos Más Vendidos
            </h2>
            <Link
              href="/admin/reportes"
              className="text-xs font-bold text-borgona hover:underline flex items-center gap-1"
            >
              Ver reporte detallado <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data?.productosMasVendidos?.length > 0 ? (
              data.productosMasVendidos.slice(0, 3).map((prod: any, idx: number) => (
                <div
                  key={prod.id}
                  className="bg-crema/50 border border-kraft/60 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-dorado uppercase">
                      Top #{idx + 1}
                    </span>
                    <h3 className="font-semibold text-sm text-chocolate leading-tight">
                      {prod.nombre}
                    </h3>
                    <p className="text-xs text-cacao">
                      {prod.unidades} unidades vendidas
                    </p>
                  </div>
                  <div className="text-right font-serif font-bold text-borgona text-sm">
                    {formatCordoba(prod.ingresos)}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-6 text-xs text-cacao italic">
                Aún no hay suficientes ventas para generar el ranking.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

