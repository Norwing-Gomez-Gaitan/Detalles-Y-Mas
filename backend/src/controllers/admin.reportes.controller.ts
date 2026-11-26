import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export class AdminReportesController {
  /**
   * Resumen mensual de ventas y ganancias, top productos y gastos por tipo
   */
  static async getReportes(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Resumen mensual vía consulta a vista o Prisma fallback
      let resumenMensual: any[] = [];
      try {
        resumenMensual = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_resumen_mensual
          LIMIT 12;
        `;
      } catch (e) {
        console.warn('Fallback para v_resumen_mensual');
      }

      // 2. Productos más vendidos
      let productosMasVendidos: any[] = [];
      try {
        productosMasVendidos = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_productos_mas_vendidos
          LIMIT 10;
        `;
      } catch (e) {
        console.warn('Fallback para v_productos_mas_vendidos');
      }

      // 3. Gastos agrupados por tipo
      const gastosPorTipo = await prisma.gasto.groupBy({
        by: ['tipo'],
        _sum: { monto: true },
        _count: { id: true }
      });

      const gastosFormateados = gastosPorTipo.map(g => ({
        tipo: g.tipo,
        total: Number(g._sum.monto || 0),
        cantidad: g._count.id
      }));

      // 4. Clientes más frecuentes
      const clientesFrecuentes = await prisma.cliente.findMany({
        include: {
          pedidos: {
            where: { estado: { not: 'cancelado' } },
            select: { total: true }
          },
          _count: { select: { pedidos: true } }
        },
        orderBy: {
          pedidos: { _count: 'desc' }
        },
        take: 10
      });

      const clientesTop = clientesFrecuentes.map(c => ({
        id: c.id,
        nombre: c.nombre,
        whatsapp: c.whatsapp,
        pedidos_count: c._count.pedidos,
        total_comprado: c.pedidos.reduce((s, p) => s + Number(p.total), 0)
      }));

      return res.json({
        resumenMensual,
        productosMasVendidos,
        gastosPorTipo: gastosFormateados,
        clientesTop
      });
    } catch (error) {
      return res.json({
        resumenMensual: [],
        productosMasVendidos: [],
        gastosPorTipo: [],
        clientesTop: []
      });
    }
  }

  /**
   * Exportación de reporte a archivo CSV
   */
  static async exportarCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const tipo = req.query.tipo || 'pedidos';

      if (tipo === 'pedidos') {
        const pedidos = await prisma.pedido.findMany({
          include: {
            cliente: { select: { nombre: true, whatsapp: true } },
            pagos: true
          },
          orderBy: { fecha_pedido: 'desc' }
        });

        let csv = 'ID,Cliente,WhatsApp,Fecha Pedido,Fecha Entrega,Estado,Total C$,Pagado C$,Saldo C$\n';
        for (const p of pedidos) {
          const total = Number(p.total);
          const pagado = p.pagos.reduce((s, pg) => s + Number(pg.monto), 0);
          const saldo = Math.max(0, total - pagado);
          csv += `"${p.id}","${p.cliente.nombre}","${p.cliente.whatsapp || ''}","${new Date(p.fecha_pedido).toISOString().split('T')[0]}","${p.fecha_entrega ? new Date(p.fecha_entrega).toISOString().split('T')[0] : ''}","${p.estado}",${total.toFixed(2)},${pagado.toFixed(2)},${saldo.toFixed(2)}\n`;
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_pedidos_detalles_y_mas.csv"');
        return res.send(csv);
      }

      if (tipo === 'materiales') {
        const mats = await prisma.material.findMany({
          include: { proveedor: { select: { nombre: true } } },
          orderBy: { nombre: 'asc' }
        });

        let csv = 'ID,Material,Unidad,Stock Actual,Stock Minimo,Costo Unitario C$,Proveedor,Bajo Stock\n';
        for (const m of mats) {
          const actual = Number(m.stock_actual);
          const min = Number(m.stock_minimo);
          csv += `"${m.id}","${m.nombre}","${m.unidad_medida}",${actual},${min},${Number(m.costo_unitario).toFixed(2)},"${m.proveedor?.nombre || 'N/A'}",${actual <= min ? 'SI' : 'NO'}\n`;
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="inventario_materiales.csv"');
        return res.send(csv);
      }

      return res.status(400).json({ error: 'Tipo de exportación no soportado' });
    } catch (error) {
      return next(error);
    }
  }
}

