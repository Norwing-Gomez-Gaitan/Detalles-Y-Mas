import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export class AdminDashboardController {
  /**
   * Métricas y resumen consolidado del Dashboard usando las vistas nativas
   */
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      let pedidosActivos = 0;
      let entregasSemana = 0;
      let saldoPorCobrar = 0;
      let pedidosPendientesList: any[] = [];
      let materialesPorReponerList: any[] = [];
      let productosMasVendidosList: any[] = [];
      let resumenMensualList: any[] = [];
      let ventasMes = 0;
      let gananciaMes = 0;

      // 1. Pedidos activos
      try {
        pedidosActivos = await prisma.pedido.count({
          where: { estado: { in: ['confirmado', 'en_produccion', 'listo'] } }
        });
      } catch (e: any) {
        console.warn('⚠️ Fallback pedidosActivos:', e.message);
      }

      // 2. Entregas en los próximos 7 días
      try {
        entregasSemana = await prisma.pedido.count({
          where: {
            estado: { in: ['confirmado', 'en_produccion', 'listo'] },
            fecha_entrega: { gte: now, lte: in7Days }
          }
        });
      } catch (e: any) {
        console.warn('⚠️ Fallback entregasSemana:', e.message);
      }

      // 3. Saldo pendiente por cobrar
      try {
        const saldoRes: any = await prisma.$queryRaw`
          SELECT COALESCE(SUM(saldo), 0)::NUMERIC(12,2) AS total_saldo
          FROM manualidades.v_saldo_pedidos
          WHERE estado <> 'cancelado' AND saldo > 0;
        `;
        if (saldoRes && saldoRes[0]) {
          saldoPorCobrar = Number(saldoRes[0].total_saldo || 0);
        }
      } catch {
        // Fallback vía Prisma si la vista no estuviera disponible
        try {
          const pedidosConPagos = await prisma.pedido.findMany({
            where: { estado: { not: 'cancelado' } },
            include: { pagos: true }
          });
          saldoPorCobrar = pedidosConPagos.reduce((acc, p) => {
            const pagado = p.pagos.reduce((s, pg) => s + Number(pg.monto), 0);
            return acc + Math.max(0, Number(p.total) - pagado);
          }, 0);
        } catch {}
      }

      // 4. Próximas entregas / pedidos pendientes
      try {
        const rawPendientes: any[] = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_pedidos_pendientes
          LIMIT 10;
        `;
        pedidosPendientesList = (rawPendientes || []).map((r: any) => ({
          ...r,
          total: Number(r.total || 0),
          pagado: Number(r.pagado || 0),
          saldo: Number(r.saldo || 0)
        }));
      } catch {
        // Fallback vía Prisma
        try {
          const pends = await prisma.pedido.findMany({
            where: { estado: { in: ['confirmado', 'en_produccion', 'listo'] } },
            include: { cliente: true, pagos: true },
            orderBy: { fecha_entrega: 'asc' },
            take: 10
          });
          pedidosPendientesList = pends.map(p => {
            const pagado = p.pagos.reduce((s, pg) => s + Number(pg.monto), 0);
            return {
              pedido_id: p.id,
              cliente: p.cliente?.nombre || 'Cliente',
              estado: p.estado,
              fecha_entrega: p.fecha_entrega,
              total: Number(p.total),
              pagado,
              saldo: Math.max(0, Number(p.total) - pagado)
            };
          });
        } catch {}
      }

      // 5. Materiales por reponer
      try {
        const rawMateriales: any[] = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_materiales_por_reponer
          LIMIT 10;
        `;
        materialesPorReponerList = (rawMateriales || []).map((r: any) => ({
          ...r,
          stock_actual: Number(r.stock_actual || 0),
          stock_minimo: Number(r.stock_minimo || 0),
          faltante: Number(r.faltante || 0)
        }));
      } catch {
        try {
          const mats = await prisma.material.findMany({
            where: { activo: true },
            include: { proveedor: true }
          });
          materialesPorReponerList = mats
            .filter(m => Number(m.stock_actual) <= Number(m.stock_minimo))
            .map(m => ({
              id: m.id,
              nombre: m.nombre,
              unidad_medida: m.unidad_medida,
              stock_actual: Number(m.stock_actual),
              stock_minimo: Number(m.stock_minimo),
              faltante: Math.max(0, Number(m.stock_minimo) - Number(m.stock_actual)),
              proveedor: m.proveedor?.nombre || null
            }));
        } catch {}
      }

      // 6. Productos más vendidos (con cálculo robusto de ingresos y unidades)
      try {
        const rawMasVendidos: any[] = await prisma.$queryRaw`
          SELECT pr.id, pr.nombre,
                 COALESCE(SUM(d.cantidad), 0)::int AS unidades,
                 COALESCE(SUM(COALESCE(d.subtotal, d.cantidad * d.precio_unitario)), 0)::numeric AS ingresos
          FROM manualidades.detalle_pedido d
          JOIN manualidades.pedidos p ON p.id = d.pedido_id AND p.estado NOT IN ('cancelado', 'cotizacion')
          JOIN manualidades.productos pr ON pr.id = d.producto_id
          GROUP BY pr.id, pr.nombre
          ORDER BY unidades DESC, ingresos DESC
          LIMIT 5;
        `;
        productosMasVendidosList = (rawMasVendidos || []).map((r: any) => ({
          id: Number(r.id),
          nombre: r.nombre,
          unidades: Number(r.unidades || 0),
          ingresos: Number(r.ingresos || 0)
        }));
      } catch (e: any) {
        console.warn('⚠️ Fallback productosMasVendidos queryRaw, intentando vista:', e.message);
        try {
          const rawVista: any[] = await prisma.$queryRaw`
            SELECT * FROM manualidades.v_productos_mas_vendidos LIMIT 5;
          `;
          productosMasVendidosList = (rawVista || []).map((r: any) => ({
            id: Number(r.id),
            nombre: r.nombre,
            unidades: Number(r.unidades || 0),
            ingresos: Number(r.ingresos || 0)
          }));
        } catch {}
      }

      // 7. Resumen mensual
      try {
        const rawResumen: any[] = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_resumen_mensual
          LIMIT 6;
        `;
        resumenMensualList = (rawResumen || []).map((r: any) => ({
          mes: r.mes,
          pedidos: Number(r.pedidos || 0),
          ventas: Number(r.ventas || 0),
          costo_estimado: Number(r.costo_estimado || 0),
          ganancia_bruta: Number(r.ganancia_bruta || 0)
        }));
      } catch (e: any) {
        console.warn('⚠️ Fallback resumenMensual:', e.message);
      }

      // 8. Ventas y Ganancia del mes actual
      try {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const pedidosMes = await prisma.pedido.findMany({
          where: {
            estado: 'entregado',
            fecha_entrega: { gte: startOfMonth, lte: endOfMonth }
          },
          include: { detalles: true }
        });

        let costoEstimadoMes = 0;
        for (const ped of pedidosMes) {
          for (const det of ped.detalles) {
            ventasMes += Number(det.subtotal || (det.cantidad * Number(det.precio_unitario)));
            costoEstimadoMes += (Number(det.costo_estimado || 0) * det.cantidad);
          }
        }
        gananciaMes = ventasMes - costoEstimadoMes;
      } catch (e: any) {
        console.warn('⚠️ Fallback ventasMes:', e.message);
      }

      return res.json({
        kpis: {
          pedidosActivos,
          entregasSemana,
          saldoPorCobrar,
          ventasMes,
          gananciaMes
        },
        pedidosPendientes: pedidosPendientesList,
        materialesPorReponer: materialesPorReponerList,
        productosMasVendidos: productosMasVendidosList,
        resumenMensual: resumenMensualList
      });
    } catch (error) {
      return next(error);
    }
  }
}
