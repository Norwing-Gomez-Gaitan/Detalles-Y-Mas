import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { materialSchema } from '../schemas/validation.js';

export class AdminInventarioController {
  /**
   * Listado de materiales con alertas de stock bajo y proveedor
   */
  static async getMateriales(req: Request, res: Response, next: NextFunction) {
    try {
      const { bajo_stock, buscar } = req.query;

      const whereClause: any = { activo: true };
      if (buscar && typeof buscar === 'string') {
        whereClause.nombre = { contains: buscar, mode: 'insensitive' };
      }

      const materiales = await prisma.material.findMany({
        where: whereClause,
        include: {
          proveedor: { select: { id: true, nombre: true } }
        },
        orderBy: { nombre: 'asc' }
      });

      const resultado = materiales.map(m => {
        const stockActual = Number(m.stock_actual);
        const stockMinimo = Number(m.stock_minimo);
        const esBajoStock = stockActual <= stockMinimo;
        return {
          ...m,
          stock_actual: stockActual,
          stock_minimo: stockMinimo,
          costo_unitario: Number(m.costo_unitario),
          bajo_stock: esBajoStock,
          faltante: esBajoStock ? Math.max(0, stockMinimo - stockActual) : 0
        };
      });

      if (bajo_stock === 'true') {
        return res.json(resultado.filter(m => m.bajo_stock));
      }

      return res.json(resultado);
    } catch (error) {
      return res.json([]);
    }
  }

  static async createMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const data = materialSchema.parse(req.body);
      const nuevo = await prisma.material.create({
        data: {
          nombre: data.nombre,
          unidad_medida: data.unidad_medida,
          stock_actual: data.stock_actual,
          stock_minimo: data.stock_minimo,
          costo_unitario: data.costo_unitario,
          proveedor_id: data.proveedor_id || null,
          activo: data.activo
        }
      });
      return res.status(201).json(nuevo);
    } catch (error) {
      return next(error);
    }
  }

  static async updateMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = materialSchema.parse(req.body);
      const actualizado = await prisma.material.update({
        where: { id },
        data: {
          nombre: data.nombre,
          unidad_medida: data.unidad_medida,
          stock_actual: data.stock_actual,
          stock_minimo: data.stock_minimo,
          costo_unitario: data.costo_unitario,
          proveedor_id: data.proveedor_id || null,
          activo: data.activo
        }
      });
      return res.json(actualizado);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Ajuste manual de inventario (merma, ajuste de conteo, consumo no registrado) con validación de existencia
   */
  static async ajustarInventario(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { tipo, cantidad, notas } = req.body;

      if (!['ajuste', 'merma', 'consumo_produccion', 'devolucion'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de movimiento no válido' });
      }

      let cantNum = Number(cantidad);
      if (isNaN(cantNum) || cantNum === 0) {
        return res.status(400).json({ error: 'La cantidad debe ser un número diferente de 0' });
      }

      // Si es merma o consumo, el ajuste representa una salida (resta)
      if ((tipo === 'merma' || tipo === 'consumo_produccion') && cantNum > 0) {
        cantNum = -cantNum;
      }

      // Si es devolución a stock, representa una entrada (suma)
      if (tipo === 'devolucion' && cantNum < 0) {
        cantNum = Math.abs(cantNum);
      }

      // Obtener material y validar stock
      const material = await prisma.material.findUnique({ where: { id } });
      if (!material) return res.status(404).json({ error: 'Material no encontrado' });

      const stockActual = Number(material.stock_actual);
      const nuevoStock = stockActual + cantNum;

      if (nuevoStock < 0) {
        return res.status(400).json({
          error: `No es posible reducir más unidades de las disponibles. Stock actual: ${stockActual} ${material.unidad_medida}. Reducción solicitada: ${Math.abs(cantNum)}.`
        });
      }

      await prisma.$transaction([
        prisma.material.update({
          where: { id },
          data: { stock_actual: nuevoStock }
        }),
        prisma.movimientoInventario.create({
          data: {
            material_id: id,
            tipo: tipo as any,
            cantidad: cantNum,
            referencia: 'ajuste_manual',
            notas: notas || null
          }
        })
      ]);

      return res.json({ mensaje: 'Inventario ajustado con éxito', nuevoStock });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Historial de movimientos de un material
   */
  static async getMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const materialId = req.query.material_id ? Number(req.query.material_id) : undefined;
      const movimientos = await prisma.movimientoInventario.findMany({
        where: materialId ? { material_id: materialId } : undefined,
        include: { material: { select: { id: true, nombre: true, unidad_medida: true } } },
        orderBy: { fecha: 'desc' },
        take: 50
      });

      // Convert BigInt id to string for JSON serialization
      const jsonMovs = movimientos.map(m => ({
        ...m,
        id: m.id.toString(),
        cantidad: Number(m.cantidad)
      }));

      return res.json(jsonMovs);
    } catch (error) {
      return next(error);
    }
  }
}

