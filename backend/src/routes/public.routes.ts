import { Router } from 'express';
import { PublicController } from '../controllers/public.controller.js';

const router = Router();

// Configuración general del negocio (lema, redes, teléfonos, etc.)
router.get('/configuracion', PublicController.getConfiguracion);

// Categorías activas
router.get('/categorias', PublicController.getCategorias);

// Catálogo de productos (soporta ?categoria=, ?buscar=, ?orden=)
router.get('/productos', PublicController.getProductos);

// Productos destacados para la página de inicio
router.get('/destacados', PublicController.getDestacados);

// Detalle de producto por slug amigable
router.get('/productos/:slug', PublicController.getProductoBySlug);

export default router;

