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

      try {
        pedidosActivos = await prisma.pedido.count({
          where: { estado: { in: ['confirmado', 'en_produccion', 'listo'] } }
        });

        entregasSemana = await prisma.pedido.count({
          where: {
            estado: { in: ['confirmado', 'en_produccion', 'listo'] },
            fecha_entrega: { gte: now, lte: in7Days }
          }
        });

        const saldoRes: any = await prisma.$queryRaw`
          SELECT COALESCE(SUM(saldo), 0)::NUMERIC(12,2) AS total_saldo
          FROM manualidades.v_saldo_pedidos
          WHERE estado <> 'cancelado' AND saldo > 0;
        `;
        if (saldoRes && saldoRes[0]) {
          saldoPorCobrar = Number(saldoRes[0].total_saldo || 0);
        }

        pedidosPendientesList = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_pedidos_pendientes
          LIMIT 10;
        `;

        materialesPorReponerList = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_materiales_por_reponer
          LIMIT 10;
        `;

        productosMasVendidosList = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_productos_mas_vendidos
          LIMIT 5;
        `;

        resumenMensualList = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_resumen_mensual
          LIMIT 6;
        `;

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
      } catch (dbErr: any) {
        console.warn('⚠️ Base de datos no disponible para dashboard, devolviendo métricas iniciales:', dbErr.message || dbErr);
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
