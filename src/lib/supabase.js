import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpouhmapulfdbsntiivi.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwb3VobWFwdWxmZGJzbnRpaXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDYzMDYsImV4cCI6MjA4OTE4MjMwNn0.7bcudd3JUX6iNC-iFN2ncnOMgOa3SL_Dx7CZLELMddI';

// Fetch silencieux : convertit les erreurs réseau en console.warn
// pour éviter le flood de console.error quand Supabase est inaccessible
const silentFetch = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch (err) {
    console.warn('[Supabase] hors-ligne:', err.message);
    throw err;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: silentFetch,
  },
});
