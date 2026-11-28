import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Permitir serialización limpia de BigInt en respuestas JSON de PostgreSQL/Prisma
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();

// Lista explícita de orígenes permitidos
const explicitOrigins = [
  'https://detalles-y-mas-psi.vercel.app',
  ENV.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Permitir Postman, curl, server-side fetch sin cabecera origin
  const lower = origin.toLowerCase().replace(/\/+$/, '');
  if (explicitOrigins.some(o => o.toLowerCase().replace(/\/+$/, '') === lower)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(lower)) return true;
  if (/^https:\/\/.*\.onrender\.com$/.test(lower)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(lower)) return true;
  return false;
};

// 1. Middleware maestro para garantizar cabeceras CORS en todas las respuestas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, X-CSRF-Token'
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
  }

  // Responder inmediatamente a las peticiones preflight OPTIONS del navegador
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }

  next();
});

// 2. Configuración CORS de paquete estándar
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Endpoint de salud para Render Web Service
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    sistema: 'Detalles y Más Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Manejo centralizado de errores
app.use(errorHandler);

const PORT = parseInt(ENV.PORT, 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌸 Servidor Detalles y Más escuchando en el puerto ${PORT}`);
  console.log(`📍 Endpoint de salud: http://localhost:${PORT}/health`);
  console.log(`🌐 Ambiente: ${ENV.NODE_ENV}`);
});

export default app;

