import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { loginSchema, verifyCodeSchema, resendCodeSchema } from '../schemas/validation.js';
import { EmailService } from '../services/email.service.js';

// Almacén en memoria para códigos 2FA temporales
interface CodeEntry {
  code: string;
  expiresAt: number;
}
const verificationCodes = new Map<string, CodeEntry>();

export class AdminAuthController {
  /**
   * Paso 1: Validación de credenciales y envío de código de confirmación al correo
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const emailLower = email.toLowerCase().trim();

      let user: { id: number; nombre: string; email: string; password_hash: string; activo: boolean } | null = null;

      try {
        user = await prisma.usuarioAdmin.findUnique({
          where: { email: emailLower }
        });
      } catch (dbError: any) {
        console.warn('\n⚠️ [AVISO BASE DE DATOS]: No se pudo autenticar con PostgreSQL en localhost:5432.');
        console.warn('Detalle:', dbError.message || dbError);
        console.warn('💡 Para usar tu PostgreSQL local, edita la contraseña en backend/.env o pon tu DATABASE_URL de Supabase.');
        console.warn('🛡️ [FALLBACK ACTIVO]: Autenticando con usuario administrador configurado...\n');

        // Fallback de desarrollo para que el usuario pueda ingresar de inmediato sin trabarse
        if (emailLower === 'left4deadchele@gmail.com') {
          const passHash = await bcrypt.hash('Hola1212', 10);
          user = {
            id: 1,
            nombre: 'Administrador Principal',
            email: 'left4deadchele@gmail.com',
            password_hash: passHash,
            activo: true,
          };
        } else if (emailLower === 'admin@detallesymas.ni') {
          const passHash = await bcrypt.hash('admin12345', 10);
          user = {
            id: 2,
            nombre: 'Dueña y Administradora',
            email: 'admin@detallesymas.ni',
            password_hash: passHash,
            activo: true,
          };
        } else {
          return res.status(401).json({ error: 'Credenciales inválidas.' });
        }
      }

      if (!user || !user.activo) {
        return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo.' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }

      // Generar código numérico de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

      verificationCodes.set(emailLower, { code, expiresAt });

      // Enviar código por correo electrónico (o consola si SMTP está vacío)
      await EmailService.sendVerificationCode(user.email, code, user.nombre);

      const hasSmtp = Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS);

      return res.json({
        require2FA: true,
        email: user.email,
        hasSmtp,
        devCode: !hasSmtp ? code : undefined,
        mensaje: hasSmtp
          ? `Se ha enviado un código de confirmación a tu correo (${user.email}).`
          : `Código generado. Al no haber SMTP configurado, revisa la consola o usa el código de desarrollo.`
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Paso 2: Verificar el código de confirmación y emitir sesión JWT
   */
  static async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, codigo } = verifyCodeSchema.parse(req.body);
      const emailLower = email.toLowerCase().trim();

      let user: { id: number; nombre: string; email: string; activo: boolean } | null = null;
      try {
        user = await prisma.usuarioAdmin.findUnique({
          where: { email: emailLower }
        });
      } catch {
        if (emailLower === 'left4deadchele@gmail.com') {
          user = {
            id: 1,
            nombre: 'Administrador Principal',
            email: 'left4deadchele@gmail.com',
            activo: true,
          };
        } else if (emailLower === 'admin@detallesymas.ni') {
          user = {
            id: 2,
            nombre: 'Dueña y Administradora',
            email: 'admin@detallesymas.ni',
            activo: true,
          };
        }
      }

      if (!user || !user.activo) {
        return res.status(401).json({ error: 'Usuario no encontrado o inactivo.' });
      }

      const entry = verificationCodes.get(emailLower);
      if (!entry) {
        return res.status(400).json({ error: 'No hay un código pendiente de verificación o ya expiró. Inicie sesión nuevamente.' });
      }

      if (Date.now() > entry.expiresAt) {
        verificationCodes.delete(emailLower);
        return res.status(400).json({ error: 'El código ha expirado. Solicite uno nuevo.' });
      }

      if (entry.code !== codigo.trim()) {
        return res.status(400).json({ error: 'Código de confirmación incorrecto.' });
      }

      // Código válido: eliminar del almacén
      verificationCodes.delete(emailLower);

      const payload = {
        id: user.id,
        email: user.email,
        nombre: user.nombre
      };

      const token = jwt.sign(payload, ENV.JWT_SECRET, {
        expiresIn: ENV.JWT_EXPIRES_IN as any
      });

      // Cookie segura para producción y desarrollo
      res.cookie('token', token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });

      return res.json({
        mensaje: 'Acceso autorizado exitosamente',
        token,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          email: user.email
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Reenviar código de confirmación
   */
  static async resendCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = resendCodeSchema.parse(req.body);
      const emailLower = email.toLowerCase().trim();

      let user: { id: number; nombre: string; email: string; activo: boolean } | null = null;
      try {
        user = await prisma.usuarioAdmin.findUnique({
          where: { email: emailLower }
        });
      } catch {
        if (emailLower === 'left4deadchele@gmail.com') {
          user = {
            id: 1,
            nombre: 'Administrador Principal',
            email: 'left4deadchele@gmail.com',
            activo: true,
          };
        } else if (emailLower === 'admin@detallesymas.ni') {
          user = {
            id: 2,
            nombre: 'Dueña y Administradora',
            email: 'admin@detallesymas.ni',
            activo: true,
          };
        }
      }

      if (!user || !user.activo) {
        return res.status(400).json({ error: 'Usuario no válido.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      verificationCodes.set(emailLower, { code, expiresAt });
      await EmailService.sendVerificationCode(user.email, code, user.nombre);

      const hasSmtp = Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS);

      return res.json({
        mensaje: hasSmtp
          ? `Nuevo código enviado a ${user.email}`
          : `Nuevo código generado en consola (SMTP no configurado).`,
        hasSmtp,
        devCode: !hasSmtp ? code : undefined
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout(req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.json({ mensaje: 'Sesión cerrada correctamente' });
  }

  /**
   * Obtener datos del usuario autenticado actual
   */
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.admin) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      let user: any = null;
      try {
        user = await prisma.usuarioAdmin.findUnique({
          where: { id: req.admin.id },
          select: { id: true, nombre: true, email: true, activo: true, creado_en: true }
        });
      } catch {
        user = {
          id: req.admin.id,
          nombre: req.admin.nombre || 'Administrador Principal',
          email: req.admin.email || 'left4deadchele@gmail.com',
          activo: true,
          creado_en: new Date()
        };
      }

      if (!user || !user.activo) {
        return res.status(401).json({ error: 'Usuario no encontrado o inactivo.' });
      }

      return res.json(user);
    } catch (error) {
      return next(error);
    }
  }
}
