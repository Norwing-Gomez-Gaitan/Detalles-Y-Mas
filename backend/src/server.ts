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

// Configuración de CORS segura para Vercel y desarrollo local
const allowedOrigins = [
  ENV.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como Postman o curl) o que coincidan con la lista
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por la política CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

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

