import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import * as ExportService from '../services/export.service.js';

export class AdminReportesController {
  /**
   * Resumen mensual de ventas y ganancias, top productos y gastos por tipo
   */
  static async getReportes(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Resumen mensual vía consulta a vista o Prisma fallback
      let resumenMensual: any[] = [];
      try {
        const rawRes: any[] = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_resumen_mensual
          LIMIT 12;
        `;
        resumenMensual = (rawRes || []).map(r => ({
          mes: r.mes,
          pedidos: Number(r.pedidos || 0),
          ventas: Number(r.ventas || 0),
          costo_estimado: Number(r.costo_estimado || 0),
          ganancia_bruta: Number(r.ganancia_bruta || 0)
        }));
      } catch (e) {
        console.warn('Fallback para v_resumen_mensual');
      }

      // 2. Productos más vendidos
      let productosMasVendidos: any[] = [];
      try {
        const rawMas: any[] = await prisma.$queryRaw`
          SELECT * FROM manualidades.v_productos_mas_vendidos
          LIMIT 10;
        `;
        productosMasVendidos = (rawMas || []).map(r => ({
          id: Number(r.id),
          nombre: r.nombre,
          unidades: Number(r.unidades || 0),
          ingresos: Number(r.ingresos || 0)
        }));
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
   * Exportación universal de datos en formatos profesionales: Excel (.xlsx), PDF y CSV
   */
  static async exportar(req: Request, res: Response, next: NextFunction) {
    try {
      const tipo = String(req.query.tipo || 'pedidos').toLowerCase();
      const formato = String(req.query.formato || (req.path.includes('csv') ? 'csv' : 'xlsx')).toLowerCase();

      // ─── 1. PEDIDOS ──────────────────────────────────────────────────────────
      if (tipo === 'pedidos') {
        const pedidos = await prisma.pedido.findMany({
          include: {
            cliente: { select: { nombre: true, whatsapp: true, telefono: true } },
            pagos: true,
            detalles: {
              include: {
                producto: { select: { nombre: true } }
              }
            }
          },
          orderBy: { fecha_pedido: 'desc' }
        });

        if (formato === 'pdf') return ExportService.exportarPedidosPdf(pedidos, res);
        if (formato === 'csv') return ExportService.exportarPedidosCsv(pedidos, res);
        return await ExportService.exportarPedidosXlsx(pedidos, res);
      }

      // ─── 2. MATERIALES / INVENTARIO ──────────────────────────────────────────
      if (tipo === 'materiales' || tipo === 'inventario') {
        const mats = await prisma.material.findMany({
          include: { proveedor: { select: { nombre: true, telefono: true } } },
          orderBy: { nombre: 'asc' }
        });

        if (formato === 'pdf') return ExportService.exportarMaterialesPdf(mats, res);
        if (formato === 'csv') return ExportService.exportarMaterialesCsv(mats, res);
        return await ExportService.exportarMaterialesXlsx(mats, res);
      }

      // ─── 3. PRODUCTOS ────────────────────────────────────────────────────────
      if (tipo === 'productos') {
        const prods = await prisma.producto.findMany({
          include: {
            categoria: { select: { nombre: true } },
            materiales: {
              include: {
                material: { select: { costo_unitario: true } }
              }
            }
          },
          orderBy: { id: 'desc' }
        });

        const productosEnriquecidos = prods.map(p => {
          let costoMateriales = 0;
          for (const item of p.materiales) {
            costoMateriales += Number(item.cantidad) * Number(item.material.costo_unitario);
          }
          const precioVenta = Number(p.precio_venta);
          const gananciaEstimada = precioVenta - costoMateriales;
          const margenPct = precioVenta > 0 ? ((gananciaEstimada / precioVenta) * 100).toFixed(1) : 0;
          return {
            ...p,
            costo_materiales: Number(costoMateriales.toFixed(2)),
            ganancia_estimada: Number(gananciaEstimada.toFixed(2)),
            margen_pct: Number(margenPct)
          };
        });

        if (formato === 'pdf') return ExportService.exportarProductosPdf(productosEnriquecidos, res);
        if (formato === 'csv') return ExportService.exportarProductosCsv(productosEnriquecidos, res);
        return await ExportService.exportarProductosXlsx(productosEnriquecidos, res);
      }

      // ─── 4. CATEGORÍAS ───────────────────────────────────────────────────────
      if (tipo === 'categorias') {
        const categorias = await prisma.categoria.findMany({
          include: {
            _count: { select: { productos: true } }
          },
          orderBy: { nombre: 'asc' }
        });

        if (formato === 'pdf') return ExportService.exportarCategoriasPdf(categorias, res);
        if (formato === 'csv') return ExportService.exportarCategoriasCsv(categorias, res);
        return await ExportService.exportarCategoriasXlsx(categorias, res);
      }

      // ─── 5. CLIENTES ─────────────────────────────────────────────────────────
      if (tipo === 'clientes') {
        const clientes = await prisma.cliente.findMany({
          include: {
            pedidos: {
              where: { estado: { not: 'cancelado' } },
              select: { total: true }
            },
            _count: { select: { pedidos: true } }
          },
          orderBy: { nombre: 'asc' }
        });

        if (formato === 'pdf') return ExportService.exportarClientesPdf(clientes, res);
        if (formato === 'csv') return ExportService.exportarClientesCsv(clientes, res);
        return await ExportService.exportarClientesXlsx(clientes, res);
      }

      // ─── 6. GASTOS ───────────────────────────────────────────────────────────
      if (tipo === 'gastos') {
        const gastos = await prisma.gasto.findMany({
          include: {
            pedido: { select: { id: true, total: true, cliente: { select: { nombre: true } } } }
          },
          orderBy: { fecha: 'desc' }
        });

        if (formato === 'pdf') return ExportService.exportarGastosPdf(gastos, res);
        if (formato === 'csv') return ExportService.exportarGastosCsv(gastos, res);
        return await ExportService.exportarGastosXlsx(gastos, res);
      }

      // ─── 7. COMPRAS ──────────────────────────────────────────────────────────
      if (tipo === 'compras') {
        const compras = await prisma.compra.findMany({
          include: {
            proveedor: { select: { nombre: true } },
            detalles: {
              include: {
                material: { select: { nombre: true } }
              }
            }
          },
          orderBy: { fecha: 'desc' }
        });

        if (formato === 'pdf') return ExportService.exportarComprasPdf(compras, res);
        if (formato === 'csv') return ExportService.exportarComprasCsv(compras, res);
        return await ExportService.exportarComprasXlsx(compras, res);
      }

      // ─── 8. PROVEEDORES ──────────────────────────────────────────────────────
      if (tipo === 'proveedores') {
        const proveedores = await prisma.proveedor.findMany({
          include: {
            _count: { select: { materiales: true, compras: true } }
          },
          orderBy: { nombre: 'asc' }
        });

        if (formato === 'pdf') return ExportService.exportarProveedoresPdf(proveedores, res);
        if (formato === 'csv') return ExportService.exportarProveedoresCsv(proveedores, res);
        return await ExportService.exportarProveedoresXlsx(proveedores, res);
      }

      // ─── 9. MOVIMIENTOS DE INVENTARIO (KARDEX) ───────────────────────────────
      if (tipo === 'movimientos') {
        const movimientos = await prisma.movimientoInventario.findMany({
          include: {
            material: { select: { nombre: true, unidad_medida: true } }
          },
          orderBy: { fecha: 'desc' }
        });

        if (formato === 'pdf') return ExportService.exportarMovimientosPdf(movimientos, res);
        if (formato === 'csv') return ExportService.exportarMovimientosCsv(movimientos, res);
        return await ExportService.exportarMovimientosXlsx(movimientos, res);
      }

      return res.status(400).json({ error: `Tipo de exportación '${tipo}' no soportado.` });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrocompatibilidad con la ruta anterior /reportes/exportar-csv
   */
  static async exportarCsv(req: Request, res: Response, next: NextFunction) {
    req.query.formato = 'csv';
    return AdminReportesController.exportar(req, res, next);
  }
}

