import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { pedidoSchema, pagoSchema } from '../schemas/validation.js';
import { PdfService } from '../services/pdf.service.js';

export class AdminPedidosController {
  /**
   * Listado de pedidos con filtros, saldo y cliente
   */
  static async getPedidos(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado, cliente_id, desde, hasta } = req.query;

      const whereClause: any = {};
      if (estado) whereClause.estado = estado;
      if (cliente_id) whereClause.cliente_id = Number(cliente_id);
      if (desde || hasta) {
        whereClause.fecha_pedido = {};
        if (desde) whereClause.fecha_pedido.gte = new Date(String(desde));
        if (hasta) whereClause.fecha_pedido.lte = new Date(String(hasta));
      }

      const pedidos = await prisma.pedido.findMany({
        where: whereClause,
        include: {
          cliente: { select: { id: true, nombre: true, telefono: true, whatsapp: true } },
          detalles: {
            include: {
              producto: { select: { id: true, nombre: true, codigo: true, imagen_url: true } }
            }
          },
          pagos: true,
          gastos: true
        },
        orderBy: { fecha_pedido: 'desc' }
      });

      // Calcular montos pagados y saldos
      const resultado = pedidos.map(ped => {
        const total = Number(ped.total);
        const pagado = ped.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
        const saldo = Math.max(0, total - pagado);
        return {
          ...ped,
          total_pagado: Number(pagado.toFixed(2)),
          saldo_pendiente: Number(saldo.toFixed(2))
        };
      });

      return res.json(resultado);
    } catch (error) {
      return res.json([]);
    }
  }

  /**
   * Obtener un pedido por ID
   */
  static async getPedidoById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const ped = await prisma.pedido.findUnique({
        where: { id },
        include: {
          cliente: true,
          detalles: {
            include: {
              producto: true
            }
          },
          pagos: { orderBy: { fecha: 'asc' } },
          gastos: true
        }
      });

      if (!ped) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const total = Number(ped.total);
      const pagado = ped.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
      const saldo = Math.max(0, total - pagado);

      return res.json({
        ...ped,
        total_pagado: Number(pagado.toFixed(2)),
        saldo_pendiente: Number(saldo.toFixed(2))
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Crear pedido con cálculo automático de totales
   */
  static async createPedido(req: Request, res: Response, next: NextFunction) {
    try {
      const data = pedidoSchema.parse(req.body);

      // Calcular subtotales
      let subtotalDetalles = 0;
      const detallesData = data.detalles.map(d => {
        const sub = d.cantidad * d.precio_unitario;
        subtotalDetalles += sub;
        return {
          producto_id: d.producto_id || null,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          costo_estimado: d.costo_estimado || 0,
          personalizacion: d.personalizacion || null,
          imagen_referencia_url: d.imagen_referencia_url || null,
          subtotal: sub
        };
      });

      const total = Math.max(0, subtotalDetalles + data.costo_envio - data.descuento);

      const nuevoPedido = await prisma.pedido.create({
        data: {
          cliente_id: data.cliente_id,
          fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
          estado: data.estado as any,
          tipo_entrega: data.tipo_entrega as any,
          direccion_entrega: data.direccion_entrega || null,
          costo_envio: data.costo_envio,
          descuento: data.descuento,
          total,
          notas: data.notas || null,
          detalles: {
            create: detallesData
          }
        },
        include: {
          cliente: true,
          detalles: true,
          pagos: true
        }
      });

      return res.status(201).json(nuevoPedido);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Actualizar estado del pedido (cotizacion, confirmado, en_produccion, listo, entregado, cancelado)
   */
  static async updateEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { estado } = req.body;

      if (!['cotizacion', 'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado'].includes(estado)) {
        return res.status(400).json({ error: 'Estado de pedido no válido' });
      }

      const actualizado = await prisma.pedido.update({
        where: { id },
        data: { estado }
      });

      return res.json(actualizado);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Registrar pago o anticipo a un pedido
   */
  static async registrarPago(req: Request, res: Response, next: NextFunction) {
    try {
      const data = pagoSchema.parse(req.body);

      const nuevoPago = await prisma.pago.create({
        data: {
          pedido_id: data.pedido_id,
          monto: data.monto,
          metodo: data.metodo as any,
          es_anticipo: data.es_anticipo,
          referencia: data.referencia || null,
          notas: data.notas || null
        }
      });

      return res.status(201).json(nuevoPago);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Generar comprobante / cotización imprimible para PDF
   */
  static async imprimirComprobante(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const ped = await prisma.pedido.findUnique({
        where: { id },
        include: {
          cliente: true,
          detalles: true,
          pagos: true
        }
      });

      if (!ped) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const config = await prisma.configuracionNegocio.findFirst() || {
        nombre: 'Detalles y Más',
        lema: 'Hecho con amor para cada ocasión',
        whatsapp: '8485-6722',
        telefono: '8485-6722',
        direccion_cobertura: 'Managua, Nicaragua'
      };

      const total = Number(ped.total);
      const totalPagado = ped.pagos.reduce((s, p) => s + Number(p.monto), 0);
      const saldoPendiente = Math.max(0, total - totalPagado);

      const html = PdfService.generateOrderHtml({
        id: ped.id,
        fecha_pedido: new Date(ped.fecha_pedido).toLocaleDateString('es-NI'),
        fecha_entrega: ped.fecha_entrega ? new Date(ped.fecha_entrega).toLocaleDateString('es-NI') : null,
        estado: ped.estado,
        tipo_entrega: ped.tipo_entrega,
        direccion_entrega: ped.direccion_entrega,
        costo_envio: Number(ped.costo_envio),
        descuento: Number(ped.descuento),
        total,
        notas: ped.notas,
        cliente: {
          nombre: ped.cliente.nombre,
          telefono: ped.cliente.telefono,
          whatsapp: ped.cliente.whatsapp,
          direccion: ped.cliente.direccion
        },
        detalles: ped.detalles.map(d => ({
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precio_unitario: Number(d.precio_unitario),
          subtotal: Number(d.subtotal || (d.cantidad * Number(d.precio_unitario))),
          personalizacion: d.personalizacion
        })),
        pagos: ped.pagos.map(p => ({
          fecha: new Date(p.fecha).toLocaleDateString('es-NI'),
          monto: Number(p.monto),
          metodo: p.metodo,
          es_anticipo: p.es_anticipo,
          referencia: p.referencia
        })),
        totalPagado,
        saldoPendiente,
        negocio: {
          nombre: config.nombre,
          lema: config.lema,
          telefono: config.telefono,
          whatsapp: config.whatsapp,
          direccion: config.direccion_cobertura
        }
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (error) {
      return next(error);
    }
  }
}

