import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { requireAdmin } from '../middleware/auth.js';
import { AdminAuthController } from '../controllers/admin.auth.controller.js';
import { AdminDashboardController } from '../controllers/admin.dashboard.controller.js';
import { AdminProductosController } from '../controllers/admin.productos.controller.js';
import { AdminPedidosController } from '../controllers/admin.pedidos.controller.js';
import { AdminClientesController } from '../controllers/admin.clientes.controller.js';
import { AdminInventarioController } from '../controllers/admin.inventario.controller.js';
import { AdminComprasController } from '../controllers/admin.compras.controller.js';
import { AdminGastosController } from '../controllers/admin.gastos.controller.js';
import { AdminReportesController } from '../controllers/admin.reportes.controller.js';
import { AdminConfiguracionController } from '../controllers/admin.configuracion.controller.js';
import { StorageService } from '../services/storage.service.js';

const router = Router();

// Configuración de Multer en memoria para procesar con Sharp antes de subir a Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // Máximo 8 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Rate limiting para login (máximo 10 intentos por ventana de 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos fallidos. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// AUTENTICACIÓN ADMIN
// ==========================================
router.post('/auth/login', loginLimiter, AdminAuthController.login);
router.post('/auth/verify-code', loginLimiter, AdminAuthController.verifyCode);
router.post('/auth/resend-code', loginLimiter, AdminAuthController.resendCode);
router.post('/auth/logout', AdminAuthController.logout);
router.get('/auth/me', requireAdmin, AdminAuthController.me);

// Todas las rutas siguientes requieren sesión de administrador
router.use(requireAdmin);

// ==========================================
// SUBIDA DE IMÁGENES A SUPABASE STORAGE
// ==========================================
router.post('/upload', upload.single('imagen'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo de imagen' });
    }
    const publicUrl = await StorageService.uploadImage(req.file.buffer, req.file.originalname);
    return res.json({ url: publicUrl });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// DASHBOARD
// ==========================================
router.get('/dashboard', AdminDashboardController.getSummary);

// ==========================================
// PRODUCTOS Y CATEGORÍAS
// ==========================================
router.get('/productos', AdminProductosController.getProductos);
router.get('/productos/:id', AdminProductosController.getProductoById);
router.post('/productos', AdminProductosController.createProducto);
router.put('/productos/:id', AdminProductosController.updateProducto);
router.patch('/productos/:id/toggle-activo', AdminProductosController.toggleActivo);

router.get('/categorias', AdminProductosController.getCategorias);
router.post('/categorias', AdminProductosController.createCategoria);
router.put('/categorias/:id', AdminProductosController.updateCategoria);

// ==========================================
// PEDIDOS Y PAGOS
// ==========================================
router.get('/pedidos', AdminPedidosController.getPedidos);
router.get('/pedidos/:id', AdminPedidosController.getPedidoById);
router.post('/pedidos', AdminPedidosController.createPedido);
router.patch('/pedidos/:id/estado', AdminPedidosController.updateEstado);
router.post('/pedidos/pagos', AdminPedidosController.registrarPago);
router.get('/pedidos/:id/imprimir', AdminPedidosController.imprimirComprobante);

// ==========================================
// CLIENTES
// ==========================================
router.get('/clientes', AdminClientesController.getClientes);
router.get('/clientes/:id', AdminClientesController.getClienteById);
router.post('/clientes', AdminClientesController.createCliente);
router.put('/clientes/:id', AdminClientesController.updateCliente);

// ==========================================
// INVENTARIO Y MATERIALES
// ==========================================
router.get('/materiales', AdminInventarioController.getMateriales);
router.post('/materiales', AdminInventarioController.createMaterial);
router.put('/materiales/:id', AdminInventarioController.updateMaterial);
router.post('/materiales/:id/ajustar', AdminInventarioController.ajustarInventario);
router.get('/materiales/movimientos', AdminInventarioController.getMovimientos);

// ==========================================
// PROVEEDORES Y COMPRAS
// ==========================================
router.get('/proveedores', AdminComprasController.getProveedores);
router.post('/proveedores', AdminComprasController.createProveedor);
router.put('/proveedores/:id', AdminComprasController.updateProveedor);

router.get('/compras', AdminComprasController.getCompras);
router.post('/compras', AdminComprasController.createCompra);

// ==========================================
// GASTOS
// ==========================================
router.get('/gastos', AdminGastosController.getGastos);
router.post('/gastos', AdminGastosController.createGasto);
router.delete('/gastos/:id', AdminGastosController.deleteGasto);

// ==========================================
// REPORTES Y CSV
// ==========================================
router.get('/reportes', AdminReportesController.getReportes);
router.get('/reportes/exportar-csv', AdminReportesController.exportarCsv);

// ==========================================
// CONFIGURACIÓN Y USUARIOS
// ==========================================
router.get('/configuracion', AdminConfiguracionController.getConfiguracion);
router.put('/configuracion', AdminConfiguracionController.updateConfiguracion);
router.get('/usuarios', AdminConfiguracionController.getUsuarios);
router.post('/usuarios/cambiar-password', AdminConfiguracionController.cambiarPassword);

export default router;

