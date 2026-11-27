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
   * Exportación de reporte a archivo CSV con formato profesional y estructurado
   */
  static async exportarCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const tipo = req.query.tipo || 'pedidos';
      const fechaActual = new Date();
      const fechaStr = fechaActual.toLocaleDateString('es-NI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const horaStr = fechaActual.toLocaleTimeString('es-NI', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Función auxiliar para escapar texto en celdas CSV
      const esc = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
        return `"${str}"`;
      };

      // Formateador de moneda en Córdobas
      const fmtCordoba = (num: number) => {
        return `C$ ${Number(num || 0).toLocaleString('es-NI', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      };

      // Formateador de fecha DD/MM/AAAA
      const fmtFecha = (dateVal: any) => {
        if (!dateVal) return 'Sin fecha';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('es-NI', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };

      // BOM UTF-8 para garantizar que Excel abra sin problemas de codificación de caracteres en español
      let csv = '\uFEFF';

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

        // 1. Encabezado institucional del reporte
        csv += `${esc('DETALLES Y MÁS - REPORTE DETALLADO DE PEDIDOS')}\n`;
        csv += `${esc(`Fecha de emisión: ${fechaStr} a las ${horaStr}`)},${esc('Moneda: Córdobas (C$)')},${esc('Taller Artesanal - Nicaragua')}\n`;
        csv += `${esc(`Total de pedidos exportados: ${pedidos.length}`)}\n`;
        csv += '\n'; // Separador visual

        // 2. Encabezados de columnas
        csv += [
          esc('N° PEDIDO'),
          esc('CLIENTE'),
          esc('WHATSAPP / TELÉFONO'),
          esc('FECHA PEDIDO'),
          esc('FECHA ENTREGA'),
          esc('TIPO ENTREGA'),
          esc('DIRECCIÓN ENTREGA'),
          esc('ESTADO PEDIDO'),
          esc('ESTADO DE PAGO'),
          esc('SUBTOTAL (C$)'),
          esc('ENVÍO (C$)'),
          esc('DESCUENTO (C$)'),
          esc('TOTAL GENERAL (C$)'),
          esc('TOTAL PAGADO (C$)'),
          esc('SALDO PENDIENTE (C$)'),
          esc('PRODUCTOS / ARTÍCULOS'),
          esc('NOTAS / OBSERVACIONES')
        ].join(',') + '\n';

        let acumTotal = 0;
        let acumPagado = 0;
        let acumSaldo = 0;

        const estadoMap: Record<string, string> = {
          cotizacion: 'Cotización',
          confirmado: 'Confirmado',
          en_produccion: 'En Producción',
          listo: 'Listo para Entrega',
          entregado: 'Entregado',
          cancelado: 'Cancelado'
        };

        const tipoEntregaMap: Record<string, string> = {
          retiro_local: 'Retiro en Taller',
          envio_domicilio: 'Envío a Domicilio'
        };

        // 3. Filas de datos
        for (const p of pedidos) {
          const total = Number(p.total);
          const pagado = p.pagos.reduce((s, pg) => s + Number(pg.monto), 0);
          const saldo = Math.max(0, total - pagado);
          const subtotal = p.detalles.reduce((s, d) => s + (Number(d.subtotal) || (Number(d.cantidad) * Number(d.precio_unitario))), 0);

          acumTotal += total;
          acumPagado += pagado;
          acumSaldo += saldo;

          let estadoPago = 'PENDIENTE';
          if (saldo <= 0.01) {
            estadoPago = 'PAGADO COMPLETO';
          } else if (pagado > 0) {
            estadoPago = 'ABONO PARCIAL';
          }

          const productosStr = p.detalles
            .map(d => `${d.cantidad}x ${d.producto?.nombre || 'Personalizado'}`)
            .join(' | ');

          const telefono = p.cliente.whatsapp || p.cliente.telefono || 'Sin registrar';

          csv += [
            esc(`#${String(p.id).padStart(4, '0')}`),
            esc(p.cliente.nombre),
            esc(telefono),
            esc(fmtFecha(p.fecha_pedido)),
            esc(fmtFecha(p.fecha_entrega)),
            esc(tipoEntregaMap[p.tipo_entrega] || p.tipo_entrega),
            esc(p.direccion_entrega || 'N/A'),
            esc(estadoMap[p.estado] || p.estado),
            esc(estadoPago),
            esc(fmtCordoba(subtotal)),
            esc(fmtCordoba(Number(p.costo_envio))),
            esc(fmtCordoba(Number(p.descuento))),
            esc(fmtCordoba(total)),
            esc(fmtCordoba(pagado)),
            esc(fmtCordoba(saldo)),
            esc(productosStr || 'Sin ítems'),
            esc(p.notas || '')
          ].join(',') + '\n';
        }

        // 4. Fila resumen con totales acumulados
        csv += '\n';
        csv += [
          esc(''),
          esc('TOTALES CONSOLIDADOS:'),
          esc(''),
          esc(''),
          esc(''),
          esc(''),
          esc(''),
          esc(''),
          esc(''),
          esc(''),
          esc(''),
          esc(''),
          esc(fmtCordoba(acumTotal)),
          esc(fmtCordoba(acumPagado)),
          esc(fmtCordoba(acumSaldo)),
          esc(''),
          esc('')
        ].join(',') + '\n';

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="Reporte_Pedidos_DetallesYMas_${fechaActual.toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);
      }

      if (tipo === 'materiales') {
        const mats = await prisma.material.findMany({
          include: { proveedor: { select: { nombre: true, telefono: true } } },
          orderBy: { nombre: 'asc' }
        });

        const enAlerta = mats.filter(m => Number(m.stock_actual) <= Number(m.stock_minimo)).length;

        // 1. Encabezado institucional del reporte de inventario
        csv += `${esc('DETALLES Y MÁS - REPORTE DE INVENTARIO Y MATERIALES')}\n`;
        csv += `${esc(`Fecha de emisión: ${fechaStr} a las ${horaStr}`)},${esc('Moneda: Córdobas (C$)')},${esc('Taller Artesanal - Nicaragua')}\n`;
        csv += `${esc(`Total de materiales: ${mats.length}`)},${esc(`Materiales en alerta de stock: ${enAlerta}`)}\n`;
        csv += '\n';

        // 2. Encabezados de columnas
        csv += [
          esc('ID'),
          esc('MATERIAL'),
          esc('UNIDAD DE MEDIDA'),
          esc('STOCK ACTUAL'),
          esc('STOCK MÍNIMO'),
          esc('DIFERENCIA / FALTANTE'),
          esc('COSTO UNITARIO (C$)'),
          esc('VALOR TOTAL EN STOCK (C$)'),
          esc('PROVEEDOR PRINCIPAL'),
          esc('ESTADO DE STOCK'),
          esc('ESTADO EN SISTEMA')
        ].join(',') + '\n';

        let acumValorTotal = 0;
        let acumUnidadesTotales = 0;

        // 3. Filas de materiales
        for (const m of mats) {
          const actual = Number(m.stock_actual);
          const min = Number(m.stock_minimo);
          const costo = Number(m.costo_unitario);
          const valorFila = actual * costo;
          const diferencia = actual - min;

          acumValorTotal += valorFila;
          acumUnidadesTotales += actual;

          const esBajo = actual <= min;
          const estadoStock = esBajo ? 'ALERTA: REPONER URGENTE' : 'STOCK ÓPTIMO';
          const diferenciaStr = esBajo ? `FALTAN ${Math.abs(diferencia).toFixed(2)}` : `SOBRAN +${diferencia.toFixed(2)}`;

          csv += [
            esc(`#${String(m.id).padStart(3, '0')}`),
            esc(m.nombre),
            esc(m.unidad_medida),
            esc(actual.toLocaleString('es-NI', { minimumFractionDigits: 0, maximumFractionDigits: 2 })),
            esc(min.toLocaleString('es-NI', { minimumFractionDigits: 0, maximumFractionDigits: 2 })),
            esc(diferenciaStr),
            esc(fmtCordoba(costo)),
            esc(fmtCordoba(valorFila)),
            esc(m.proveedor?.nombre || 'Sin Proveedor Asignado'),
            esc(estadoStock),
            esc(m.activo ? 'Activo' : 'Inactivo')
          ].join(',') + '\n';
        }

        // 4. Fila resumen con valorización de inventario
        csv += '\n';
        csv += [
          esc(''),
          esc('TOTALES DE INVENTARIO:'),
          esc(''),
          esc(acumUnidadesTotales.toLocaleString('es-NI', { minimumFractionDigits: 0, maximumFractionDigits: 2 })),
          esc(''),
          esc(''),
          esc(''),
          esc(fmtCordoba(acumValorTotal)),
          esc(''),
          esc(`Alertas: ${enAlerta} materiales`),
          esc('')
        ].join(',') + '\n';

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="Inventario_Materiales_DetallesYMas_${fechaActual.toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);
      }

      return res.status(400).json({ error: 'Tipo de exportación no soportado' });
    } catch (error) {
      return next(error);
    }
  }
}

