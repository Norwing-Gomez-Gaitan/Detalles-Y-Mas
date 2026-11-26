import sharp from 'sharp';
import crypto from 'crypto';
import { getSupabase } from '../config/supabase.js';
import { ENV } from '../config/env.js';

export class StorageService {
  /**
   * Procesa, comprime y sube una imagen a Supabase Storage (bucket público 'productos').
   */
  static async uploadImage(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    // 1. Optimizar con sharp: convertir a WebP con ancho máximo 1200px y calidad 80
    const processedBuffer = await sharp(fileBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const uniqueId = crypto.randomUUID();
    const filename = `${uniqueId}.webp`;

    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase.storage
        .from(ENV.SUPABASE_BUCKET)
        .upload(`catalogo/${filename}`, processedBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        });

      if (error) {
        console.error('Error al subir imagen a Supabase Storage:', error);
        throw new Error('Error al subir la imagen al almacenamiento en la nube.');
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from(ENV.SUPABASE_BUCKET)
        .getPublicUrl(`catalogo/${filename}`);

      return publicUrlData.publicUrl;
    }

    // Modo fallback si Supabase no está configurado (por ejemplo, prueba local)
    // Devuelve un Data URI para pruebas locales
    const base64 = processedBuffer.toString('base64');
    return `data:image/webp;base64,${base64}`;
  }
}

