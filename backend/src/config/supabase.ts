import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!supabaseClient) {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ Credenciales de Supabase no configuradas. El almacenamiento funcionará en modo simulado/local.');
      return null;
    }
    supabaseClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
};

