import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { productoSchema, categoriaSchema } from '../schemas/validation.js';
import { storeService } from '../services/store.service.js';

export class AdminProductosController {
  /**
   * Listar todos los productos para el panel (con cálculo de costos y márgenes)
   */
  static async getProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoria_id, buscar, activo } = req.query;

      const whereClause: any = {};
      if (categoria_id) whereClause.categoria_id = Number(categoria_id);
      if (activo !== undefined) whereClause.activo = activo === 'true';
      if (buscar && typeof buscar === 'string') {
        whereClause.OR = [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { codigo: { contains: buscar, mode: 'insensitive' } },
        ];
      }

      const productos = await prisma.producto.findMany({
        where: whereClause,
        include: {
          categoria: { select: { id: true, nombre: true } },
          imagenes: { orderBy: { orden: 'asc' } },
          materiales: {
            include: {
              material: { select: { id: true, nombre: true, unidad_medida: true, costo_unitario: true } }
            }
          }
        },
        orderBy: { id: 'desc' }
      });

      // Enriquecer con cálculo de receta en tiempo real
      const resultado = productos.map(p => {
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

      return res.json(resultado);
    } catch (error) {
      return res.json(storeService.getAllProductsAdmin());
    }
  }

  /**
   * Obtener detalle completo de un producto con su receta
   */
  static async getProductoById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const producto = await prisma.producto.findUnique({
        where: { id },
        include: {
          categoria: true,
          imagenes: { orderBy: { orden: 'asc' } },
          materiales: {
            include: {
              material: true
            }
          }
        }
      });

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      let costoMateriales = 0;
      for (const item of producto.materiales) {
        costoMateriales += Number(item.cantidad) * Number(item.material.costo_unitario);
      }
      const precioVenta = Number(producto.precio_venta);
      const gananciaEstimada = precioVenta - costoMateriales;
      const margenPct = precioVenta > 0 ? ((gananciaEstimada / precioVenta) * 100).toFixed(1) : 0;

      return res.json({
        ...producto,
        costo_materiales: Number(costoMateriales.toFixed(2)),
        ganancia_estimada: Number(gananciaEstimada.toFixed(2)),
        margen_pct: Number(margenPct)
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Crear nuevo producto con slug automático, imágenes y receta de materiales
   */
  static async createProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const data = productoSchema.parse(req.body);

      // Generar slug amigable único si no viene
      let slug = data.slug;
      if (!slug) {
        slug = data.nombre
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Verificar si existe para añadir sufijo
        const exists = await prisma.producto.findUnique({ where: { slug } });
        if (exists) {
          slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
      }

      const nuevo = await prisma.producto.create({
        data: {
          categoria_id: data.categoria_id,
          codigo: data.codigo,
          slug,
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio_venta: data.precio_venta,
          tiempo_elaboracion_min: data.tiempo_elaboracion_min,
          es_personalizable: data.es_personalizable,
          stock_terminado: data.stock_terminado,
          imagen_url: data.imagen_url || (data.imagenes && data.imagenes[0]) || null,
          visible_catalogo: data.visible_catalogo,
          destacado: data.destacado,
          activo: data.activo,
          imagenes: data.imagenes && data.imagenes.length > 0 ? {
            create: data.imagenes.map((url, idx) => ({ url, orden: idx + 1 }))
          } : undefined,
          materiales: data.materiales && data.materiales.length > 0 ? {
            create: data.materiales.map(m => ({
              material_id: m.material_id,
              cantidad: m.cantidad
            }))
          } : undefined
        },
        include: {
          categoria: true,
          imagenes: true,
          materiales: { include: { material: true } }
        }
      });

      return res.status(201).json(nuevo);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Actualizar producto, imágenes y receta
   */
  static async updateProducto(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = productoSchema.parse(req.body);

      // Si vienen materiales, actualizar la relación
      if (data.materiales !== undefined) {
        await prisma.productoMaterial.deleteMany({ where: { producto_id: id } });
      }

      // Si vienen imágenes, actualizar la relación
      if (data.imagenes !== undefined) {
        await prisma.productoImagen.deleteMany({ where: { producto_id: id } });
      }

      const actualizado = await prisma.producto.update({
        where: { id },
        data: {
          categoria_id: data.categoria_id,
          codigo: data.codigo,
          slug: data.slug,
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio_venta: data.precio_venta,
          tiempo_elaboracion_min: data.tiempo_elaboracion_min,
          es_personalizable: data.es_personalizable,
          stock_terminado: data.stock_terminado,
          imagen_url: data.imagen_url || (data.imagenes && data.imagenes[0]) || undefined,
          visible_catalogo: data.visible_catalogo,
          destacado: data.destacado,
          activo: data.activo,
          imagenes: data.imagenes && data.imagenes.length > 0 ? {
            create: data.imagenes.map((url, idx) => ({ url, orden: idx + 1 }))
          } : undefined,
          materiales: data.materiales && data.materiales.length > 0 ? {
            create: data.materiales.map(m => ({
              material_id: m.material_id,
              cantidad: m.cantidad
            }))
          } : undefined
        },
        include: {
          categoria: true,
          imagenes: true,
          materiales: { include: { material: true } }
        }
      });

      return res.json(actualizado);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Desactivar producto (baja lógica para no romper historial)
   */
  static async toggleActivo(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actual = await prisma.producto.findUnique({ where: { id } });
      if (!actual) return res.status(404).json({ error: 'Producto no encontrado' });

      const modificado = await prisma.producto.update({
        where: { id },
        data: { activo: !actual.activo }
      });

      return res.json({ mensaje: `Producto ${modificado.activo ? 'activado' : 'desactivado'} con éxito`, producto: modificado });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Categorías CRUD
   */
  static async getCategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const cats = await prisma.categoria.findMany({
        include: { _count: { select: { productos: true } } },
        orderBy: { nombre: 'asc' }
      });
      return res.json(cats);
    } catch (error) {
      return res.json(storeService.getCategories().map(c => ({ ...c, _count: { productos: 1 } })));
    }
  }

  static async createCategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const data = categoriaSchema.parse(req.body);
      const cat = await prisma.categoria.create({ data });
      return res.status(201).json(cat);
    } catch (error) {
      return next(error);
    }
  }

  static async updateCategoria(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = categoriaSchema.parse(req.body);
      const cat = await prisma.categoria.update({
        where: { id },
        data
      });
      return res.json(cat);
    } catch (error) {
      return next(error);
    }
  }
}

