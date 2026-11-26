import nodemailer, { type Transporter } from 'nodemailer';
import { ENV } from '../config/env.js';

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465, // true para 465, false para otros puertos como 587
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });
      return this.transporter;
    }

    return null;
  }

  /**
   * Envía el código de confirmación de 6 dígitos para inicio de sesión en el Panel Admin
   */
  static async sendVerificationCode(email: string, code: string, nombre: string): Promise<boolean> {
    const transporter = this.getTransporter();

    const subject = `🔐 Código de Acceso: ${code} - Detalles y Más`;
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FBF4E8; margin: 0; padding: 20px; color: #4A2C2A; }
          .container { max-width: 500px; margin: 0 auto; background-color: #FFFCF7; border: 1px solid #D9C3A0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 2px solid #C9A24D; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { color: #8E2A45; font-size: 24px; font-weight: bold; margin: 0; }
          .slogan { color: #C9A24D; font-size: 13px; font-weight: bold; margin-top: 4px; }
          .content { text-align: center; }
          .code-box { background-color: #FBF4E8; border: 2px dashed #8E2A45; border-radius: 8px; padding: 18px; margin: 25px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8E2A45; }
          .info { font-size: 14px; color: #6B544C; line-height: 1.6; }
          .footer { margin-top: 30px; border-top: 1px solid #D9C3A0; padding-top: 15px; font-size: 11px; text-align: center; color: #6B544C; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand">Detalles y Más</h1>
            <div class="slogan">Hecho con amor para cada ocasión</div>
          </div>
          <div class="content">
            <h2 style="color: #4A2C2A; font-size: 18px; margin-bottom: 10px;">Verificación de Seguridad</h2>
            <p class="info">Hola <strong>${nombre}</strong>, has solicitado iniciar sesión en el Panel Administrativo. Usa el siguiente código para completar tu acceso:</p>
            
            <div class="code-box">${code}</div>

            <p class="info">Este código es de un solo uso y expirará en <strong>15 minutos</strong>. Si tú no solicitaste este acceso, puedes ignorar este correo de forma segura.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Detalles y Más - Managua, Nicaragua.<br>
            Sistema de Seguridad de Acceso Administrativo.
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('\n============================================================');
    console.log(`📧 [CÓDIGO DE CONFIRMACIÓN 2FA]`);
    console.log(`Para: ${email} (${nombre})`);
    console.log(`CÓDIGO: >>> ${code} <<<`);
    console.log(`Válido por 15 minutos.`);
    console.log('============================================================\n');

    if (transporter) {
      try {
        await transporter.sendMail({
          from: ENV.SMTP_FROM,
          to: email,
          subject,
          html,
        });
        console.log(`✅ Correo enviado con éxito a ${email}`);
        return true;
      } catch (err) {
        console.error('❌ Error al enviar correo vía SMTP:', err);
        // Aun si falla el envío de red SMTP externo, el código queda registrado en el log del backend
        return false;
      }
    } else {
      console.log('ℹ️ SMTP no configurado en .env. El código ha sido impreso en la consola para desarrollo.');
      return true;
    }
  }
}
