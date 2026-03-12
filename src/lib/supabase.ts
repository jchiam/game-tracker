import { createClient } from '@supabase/supabase-js';

console.log(import.meta.env);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
console.log('test');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
