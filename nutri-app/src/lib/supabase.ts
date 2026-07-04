import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configure em .env (veja .env.example) com os dados do seu projeto Supabase (Settings > API)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuração do Supabase ausente. Defina EXPO_PUBLIC_SUPABASE_URL e ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY (veja .env.example) antes de iniciar o app.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Atualize com a URL real depois de publicar (ex: https://nutri-app.vercel.app)
const APP_BASE_URL =
  process.env.EXPO_PUBLIC_APP_BASE_URL ?? 'https://SEU-DOMINIO.vercel.app';

export const PRIVACY_POLICY_URL = `${APP_BASE_URL}/privacy.html`;
export const TERMS_OF_USE_URL = `${APP_BASE_URL}/terms.html`;
