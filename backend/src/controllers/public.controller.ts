import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { storeService } from '../services/store.service.js';

export class PublicController {
  /**
   * Obtiene la configuración pública del negocio (lema, WhatsApp, redes, horarios, etc.)
   */
  static async getConfiguracion(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await prisma.configuracionNegocio.findFirst();
      if (config) {
        return res.json(config);
      }
    } catch {
      // Fallback a almacenamiento local persistente
    }
    return res.json(storeService.getConfig());
  }

  /**
   * Obtiene la lista de categorías activas
   */
  static async getCategorias(req: Request, res: Response, next: NextFunction) {
    try {
      const categorias = await prisma.categoria.findMany({
        where: { activa: true },
        select: { id: true, nombre: true, descripcion: true },
        orderBy: { nombre: 'asc' }
      });
      return res.json(categorias);
    } catch {
      return res.json(storeService.getCategories());
    }
  }

  /**
   * Catálogo público: SOLO productos activos y visibles.
   * NUNCA expone costos, recetas, márgenes ni stock de materiales.
   */
  static async getProductos(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoria, buscar, orden } = req.query;

      const whereClause: any = {
        activo: true,
        visible_catalogo: true,
      };

      if (categoria && typeof categoria === 'string') {
        const catId = parseInt(categoria, 10);
        if (!isNaN(catId)) {
          whereClause.categoria_id = catId;
        }
      }

      if (buscar && typeof buscar === 'string' && buscar.trim() !== '') {
        whereClause.OR = [
          { nombre: { contains: buscar.trim(), mode: 'insensitive' } },
          { descripcion: { contains: buscar.trim(), mode: 'insensitive' } }
        ];
      }

      let orderBy: any = { creado_en: 'desc' };
      if (orden === 'precio_asc') orderBy = { precio_venta: 'asc' };
      if (orden === 'precio_desc') orderBy = { precio_venta: 'desc' };
      if (orden === 'nombre_asc') orderBy = { nombre: 'asc' };

      const productos = await prisma.producto.findMany({
        where: whereClause,
        select: {
          id: true,
          slug: true,
          codigo: true,
          nombre: true,
          descripcion: true,
          precio_venta: true,
          es_personalizable: true,
          stock_terminado: true,
          imagen_url: true,
          destacado: true,
          categoria: {
            select: { id: true, nombre: true }
          },
          imagenes: {
            select: { id: true, url: true, orden: true },
            orderBy: { orden: 'asc' }
          }
        },
        orderBy
      });

      return res.json(productos);
    } catch {
      return res.json(storeService.getProducts({
        categoria: typeof req.query.categoria === 'string' ? req.query.categoria : undefined,
        buscar: typeof req.query.buscar === 'string' ? req.query.buscar : undefined,
        orden: typeof req.query.orden === 'string' ? req.query.orden : undefined,
      }));
    }
  }

  /**
   * Detalle de producto por su slug
   */
  static async getProductoBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const producto = await prisma.producto.findFirst({
        where: {
          slug,
          activo: true,
          visible_catalogo: true
        },
        select: {
          id: true,
          slug: true,
          codigo: true,
          nombre: true,
          descripcion: true,
          precio_venta: true,
          tiempo_elaboracion_min: true,
          es_personalizable: true,
          stock_terminado: true,
          imagen_url: true,
          destacado: true,
          categoria: {
            select: { id: true, nombre: true }
          },
          imagenes: {
            select: { id: true, url: true, orden: true },
            orderBy: { orden: 'asc' }
          }
        }
      });

      if (producto) {
        return res.json(producto);
      }
    } catch {
      // Intentar buscar en store local
    }

    const fallbackProd = storeService.getProductBySlug(req.params.slug);
    if (fallbackProd) {
      return res.json(fallbackProd);
    }

    return res.status(404).json({ error: 'Producto no encontrado o no disponible.' });
  }

  /**
   * Productos destacados para la página de inicio
   */
  static async getDestacados(req: Request, res: Response, next: NextFunction) {
    try {
      const destacados = await prisma.producto.findMany({
        where: {
          activo: true,
          visible_catalogo: true,
          destacado: true
        },
        select: {
          id: true,
          slug: true,
          codigo: true,
          nombre: true,
          descripcion: true,
          precio_venta: true,
          es_personalizable: true,
          imagen_url: true,
          categoria: { select: { id: true, nombre: true } }
        },
        take: 8,
        orderBy: { id: 'desc' }
      });

      return res.json(destacados);
    } catch {
      return res.json(storeService.getFeaturedProducts());
    }
  }
}

