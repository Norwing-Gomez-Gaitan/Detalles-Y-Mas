import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { gastoSchema } from '../schemas/validation.js';

export class AdminGastosController {
  /**
   * Listar gastos con filtros de fecha y tipo
   */
  static async getGastos(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipo, desde, hasta, pedido_id } = req.query;

      const whereClause: any = {};
      if (tipo) whereClause.tipo = tipo;
      if (pedido_id) whereClause.pedido_id = Number(pedido_id);
      if (desde || hasta) {
        whereClause.fecha = {};
        if (desde) whereClause.fecha.gte = new Date(String(desde));
        if (hasta) whereClause.fecha.lte = new Date(String(hasta));
      }

      const gastos = await prisma.gasto.findMany({
        where: whereClause,
        include: {
          pedido: { select: { id: true, total: true, cliente: { select: { nombre: true } } } }
        },
        orderBy: { fecha: 'desc' }
      });

      return res.json(gastos);
    } catch (error) {
      return res.json([]);
    }
  }

  static async createGasto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = gastoSchema.parse(req.body);

      const nuevo = await prisma.gasto.create({
        data: {
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
          tipo: data.tipo as any,
          descripcion: data.descripcion,
          monto: data.monto,
          pedido_id: data.pedido_id || null
        }
      });

      return res.status(201).json(nuevo);
    } catch (error) {
      return next(error);
    }
  }

  static async deleteGasto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await prisma.gasto.delete({ where: { id } });
      return res.json({ mensaje: 'Gasto eliminado con éxito' });
    } catch (error) {
      return next(error);
    }
  }
}

