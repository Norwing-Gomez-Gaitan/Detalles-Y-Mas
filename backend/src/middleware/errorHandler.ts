import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error capturado en el servidor:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Error de validación de datos',
      detalles: err.errors.map(e => ({
        campo: e.path.join('.'),
        mensaje: e.message
      }))
    });
  }

  // Error genérico sin exponer datos sensibles
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ocurrió un error interno en el servidor.';

  return res.status(statusCode).json({ error: message });
};

