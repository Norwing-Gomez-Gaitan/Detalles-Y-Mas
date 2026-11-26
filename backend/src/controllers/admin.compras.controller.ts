import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { compraSchema, proveedorSchema } from '../schemas/validation.js';

export class AdminComprasController {
  /**
   * Listar proveedores
   */
  static async getProveedores(req: Request, res: Response, next: NextFunction) {
    try {
      const proveedores = await prisma.proveedor.findMany({
        where: { activo: true },
        include: { _count: { select: { materiales: true, compras: true } } },
        orderBy: { nombre: 'asc' }
      });
      return res.json(proveedores);
    } catch (error) {
      return res.json([]);
    }
  }

  static async createProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const data = proveedorSchema.parse(req.body);
      const nuevo = await prisma.proveedor.create({
        data: {
          nombre: data.nombre,
          contacto: data.contacto || null,
          telefono: data.telefono || null,
          email: data.email || null,
          direccion: data.direccion || null,
          notas: data.notas || null,
          activo: data.activo
        }
      });
      return res.status(201).json(nuevo);
    } catch (error) {
      return next(error);
    }
  }

  static async updateProveedor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = proveedorSchema.parse(req.body);
      const actualizado = await prisma.proveedor.update({
        where: { id },
        data: {
          nombre: data.nombre,
          contacto: data.contacto || null,
          telefono: data.telefono || null,
          email: data.email || null,
          direccion: data.direccion || null,
          notas: data.notas || null,
          activo: data.activo
        }
      });
      return res.json(actualizado);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Listar compras con proveedor y totales
   */
  static async getCompras(req: Request, res: Response, next: NextFunction) {
    try {
      const compras = await prisma.compra.findMany({
        include: {
          proveedor: { select: { id: true, nombre: true } },
          detalles: {
            include: {
              material: { select: { id: true, nombre: true, unidad_medida: true } }
            }
          }
        },
        orderBy: { fecha: 'desc' }
      });
      return res.json(compras);
    } catch (error) {
      return res.json([]);
    }
  }

  /**
   * Registrar una compra con múltiples líneas.
   * El trigger de base de datos 'trg_detalle_compra_stock' actualiza automáticamente el stock,
   * el costo unitario del material y deja registro en movimientos_inventario.
   */
  static async createCompra(req: Request, res: Response, next: NextFunction) {
    try {
      const data = compraSchema.parse(req.body);

      let totalCompra = 0;
      const detallesData = data.detalles.map(d => {
        const sub = Number((d.cantidad * d.costo_unitario).toFixed(2));
        totalCompra += sub;
        return {
          material_id: d.material_id,
          cantidad: d.cantidad,
          costo_unitario: d.costo_unitario,
          subtotal: sub
        };
      });

      const nuevaCompra = await prisma.compra.create({
        data: {
          proveedor_id: data.proveedor_id || null,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
          numero_factura: data.numero_factura || null,
          total: totalCompra,
          notas: data.notas || null,
          detalles: {
            create: detallesData
          }
        },
        include: {
          proveedor: true,
          detalles: { include: { material: true } }
        }
      });

      return res.status(201).json(nuevaCompra);
    } catch (error) {
      return next(error);
    }
  }
}

