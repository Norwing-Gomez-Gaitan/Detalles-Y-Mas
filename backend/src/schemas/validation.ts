import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const verifyCodeSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  codigo: z.string().min(4, 'El código debe tener al menos 4 caracteres').max(10),
});

export const resendCodeSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

export const productoSchema = z.object({
  categoria_id: z.number().int().positive('La categoría es requerida'),
  codigo: z.string().min(1, 'El código es requerido').max(30),
  slug: z.string().min(1, 'El slug es requerido').max(150).optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  descripcion: z.string().optional().nullable(),
  precio_venta: z.number().nonnegative('El precio debe ser mayor o igual a 0'),
  tiempo_elaboracion_min: z.number().int().nonnegative().optional().nullable(),
  es_personalizable: z.boolean().default(false),
  stock_terminado: z.number().int().nonnegative().default(0),
  imagen_url: z.string().optional().nullable(),
  visible_catalogo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  activo: z.boolean().default(true),
  imagenes: z.array(z.string().url()).optional(),
  materiales: z.array(z.object({
    material_id: z.number().int().positive(),
    cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  })).optional(),
});

export const categoriaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  descripcion: z.string().optional().nullable(),
  activa: z.boolean().default(true),
});

export const materialSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  unidad_medida: z.string().min(1, 'La unidad de medida es requerida').max(20),
  stock_actual: z.number().nonnegative().default(0),
  stock_minimo: z.number().nonnegative().default(0),
  costo_unitario: z.number().nonnegative().default(0),
  proveedor_id: z.number().int().positive().optional().nullable(),
  activo: z.boolean().default(true),
});

export const proveedorSchema = z.object({
  nombre: z.string().min(2).max(120),
  contacto: z.string().max(100).optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

export const compraSchema = z.object({
  proveedor_id: z.number().int().positive().optional().nullable(),
  fecha: z.string().optional(), // YYYY-MM-DD
  numero_factura: z.string().max(50).optional().nullable(),
  notas: z.string().optional().nullable(),
  detalles: z.array(z.object({
    material_id: z.number().int().positive(),
    cantidad: z.number().positive(),
    costo_unitario: z.number().nonnegative(),
  })).min(1, 'La compra debe tener al menos un material'),
});

export const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido').max(120),
  telefono: z.string().max(30).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
  red_social: z.string().max(100).optional().nullable(),
  fecha_especial: z.string().optional().nullable(), // YYYY-MM-DD
  notas: z.string().optional().nullable(),
});

export const pedidoSchema = z.object({
  cliente_id: z.number().int().positive('El cliente es requerido'),
  fecha_entrega: z.string().optional().nullable(),
  estado: z.enum(['cotizacion', 'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado']).default('cotizacion'),
  tipo_entrega: z.enum(['retiro_local', 'domicilio', 'envio']).default('retiro_local'),
  direccion_entrega: z.string().optional().nullable(),
  costo_envio: z.number().nonnegative().default(0),
  descuento: z.number().nonnegative().default(0),
  notas: z.string().optional().nullable(),
  detalles: z.array(z.object({
    producto_id: z.number().int().positive().optional().nullable(),
    descripcion: z.string().min(1, 'La descripción de la línea es requerida'),
    cantidad: z.number().int().positive(),
    precio_unitario: z.number().nonnegative(),
    costo_estimado: z.number().nonnegative().default(0),
    personalizacion: z.string().optional().nullable(),
    imagen_referencia_url: z.string().optional().nullable(),
  })).min(1, 'El pedido debe tener al menos un detalle'),
});

export const pagoSchema = z.object({
  pedido_id: z.number().int().positive(),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  metodo: z.enum(['efectivo', 'transferencia', 'tarjeta', 'billetera_movil', 'otro']).default('efectivo'),
  es_anticipo: z.boolean().default(false),
  referencia: z.string().max(80).optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const gastoSchema = z.object({
  fecha: z.string().optional(),
  tipo: z.enum(['transporte', 'empaque', 'publicidad', 'servicios', 'herramientas', 'otro']).default('otro'),
  descripcion: z.string().min(2).max(200),
  monto: z.number().positive(),
  pedido_id: z.number().int().positive().optional().nullable(),
});

export const configuracionSchema = z.object({
  nombre: z.string().min(1).max(120),
  lema: z.string().max(200),
  telefono: z.string().max(30).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  facebook: z.string().max(100).optional().nullable(),
  direccion_cobertura: z.string().optional().nullable(),
  horario: z.string().optional().nullable(),
  sobre_nosotros: z.string().optional().nullable(),
});

