import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { clienteSchema } from '../schemas/validation.js';

export class AdminClientesController {
  /**
   * Listar clientes con total comprado, número de pedidos y alerta de fechas especiales
   */
  static async getClientes(req: Request, res: Response, next: NextFunction) {
    try {
      const { buscar } = req.query;

      const whereClause: any = {};
      if (buscar && typeof buscar === 'string') {
        whereClause.OR = [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { telefono: { contains: buscar, mode: 'insensitive' } },
          { whatsapp: { contains: buscar, mode: 'insensitive' } },
          { email: { contains: buscar, mode: 'insensitive' } },
        ];
      }

      const clientes = await prisma.cliente.findMany({
        where: whereClause,
        include: {
          pedidos: {
            where: { estado: { not: 'cancelado' } },
            select: { total: true }
          },
          _count: { select: { pedidos: true } }
        },
        orderBy: { nombre: 'asc' }
      });

      const hoy = new Date();
      const resultado = clientes.map(c => {
        const totalComprado = c.pedidos.reduce((sum, p) => sum + Number(p.total), 0);

        // Comprobar si la fecha especial es en los próximos 15 días (comparando mes y día)
        let esFechaProxima = false;
        let diasParaFecha: number | null = null;
        if (c.fecha_especial) {
          const f = new Date(c.fecha_especial);
          const fechaEsteAno = new Date(hoy.getFullYear(), f.getMonth(), f.getDate());
          if (fechaEsteAno < hoy) {
            fechaEsteAno.setFullYear(hoy.getFullYear() + 1);
          }
          const diffMs = fechaEsteAno.getTime() - hoy.getTime();
          const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (diffDias >= 0 && diffDias <= 15) {
            esFechaProxima = true;
            diasParaFecha = diffDias;
          }
        }

        return {
          id: c.id,
          nombre: c.nombre,
          telefono: c.telefono,
          whatsapp: c.whatsapp,
          email: c.email,
          direccion: c.direccion,
          red_social: c.red_social,
          fecha_especial: c.fecha_especial,
          notas: c.notas,
          creado_en: c.creado_en,
          pedidos_count: c._count.pedidos,
          total_comprado: Number(totalComprado.toFixed(2)),
          es_fecha_proxima: esFechaProxima,
          dias_para_fecha: diasParaFecha
        };
      });

      return res.json(resultado);
    } catch (error) {
      return res.json([]);
    }
  }

  static async getClienteById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const cliente = await prisma.cliente.findUnique({
        where: { id },
        include: {
          pedidos: {
            include: {
              detalles: true,
              pagos: true
            },
            orderBy: { fecha_pedido: 'desc' }
          }
        }
      });

      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
      return res.json(cliente);
    } catch (error) {
      return next(error);
    }
  }

  static async createCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const data = clienteSchema.parse(req.body);
      const nuevo = await prisma.cliente.create({
        data: {
          nombre: data.nombre,
          telefono: data.telefono || null,
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          direccion: data.direccion || null,
          red_social: data.red_social || null,
          fecha_especial: data.fecha_especial ? new Date(data.fecha_especial) : null,
          notas: data.notas || null
        }
      });
      return res.status(201).json(nuevo);
    } catch (error) {
      return next(error);
    }
  }

  static async updateCliente(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = clienteSchema.parse(req.body);
      const actualizado = await prisma.cliente.update({
        where: { id },
        data: {
          nombre: data.nombre,
          telefono: data.telefono || null,
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          direccion: data.direccion || null,
          red_social: data.red_social || null,
          fecha_especial: data.fecha_especial ? new Date(data.fecha_especial) : null,
          notas: data.notas || null
        }
      });
      return res.json(actualizado);
    } catch (error) {
      return next(error);
    }
  }
}

