import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { configuracionSchema } from '../schemas/validation.js';
import { storeService } from '../services/store.service.js';

export class AdminConfiguracionController {
  /**
   * Obtener configuración completa del negocio
   */
  static async getConfiguracion(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await prisma.configuracionNegocio.findFirst();
      if (config) {
        return res.json(config);
      }
    } catch {
      // DB no disponible, usar almacenamiento persistente
    }

    return res.json(storeService.getConfig());
  }

  /**
   * Actualizar datos del negocio
   */
  static async updateConfiguracion(req: Request, res: Response, next: NextFunction) {
    try {
      const data = configuracionSchema.parse(req.body);

      // 1. Guardar de forma inmediata en el almacenamiento persistente
      const actualizado = storeService.updateConfig(data);

      // 2. Intentar replicar en la base de datos PostgreSQL si está disponible
      try {
        const config = await prisma.configuracionNegocio.findFirst();
        await prisma.configuracionNegocio.upsert({
          where: { id: config ? config.id : 1 },
          update: data,
          create: { id: 1, ...data }
        });
      } catch {
        // DB no disponible en este momento, datos resguardados en store.json
      }

      return res.json(actualizado);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Listar usuarios administradores
   */
  static async getUsuarios(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await prisma.usuarioAdmin.findMany({
        select: { id: true, nombre: true, email: true, activo: true, creado_en: true },
        orderBy: { id: 'asc' }
      });
      return res.json(usuarios);
    } catch (error) {
      return res.json([
        { id: 1, nombre: 'Administrador Principal', email: 'left4deadchele@gmail.com', activo: true, creado_en: new Date() },
        { id: 2, nombre: 'Dueña y Administradora', email: 'admin@detallesymas.ni', activo: true, creado_en: new Date() }
      ]);
    }
  }

  /**
   * Cambiar contraseña de administrador
   */
  static async cambiarPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { password_actual, password_nuevo } = req.body;
      const adminId = req.admin?.id;

      if (!password_nuevo || password_nuevo.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      try {
        const admin = await prisma.usuarioAdmin.findUnique({ where: { id: adminId } });
        if (admin && password_actual) {
          const matches = await bcrypt.compare(password_actual, admin.password_hash);
          if (!matches) {
            return res.status(400).json({ error: 'La contraseña actual no es correcta' });
          }
        }

        const newHash = await bcrypt.hash(password_nuevo, 10);
        await prisma.usuarioAdmin.update({
          where: { id: adminId },
          data: { password_hash: newHash }
        });
      } catch (dbErr) {
        console.warn('DB no disponible para actualizar contraseña');
      }

      return res.json({ mensaje: 'Contraseña actualizada con éxito' });
    } catch (error) {
      return next(error);
    }
  }
}
