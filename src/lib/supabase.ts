import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.STORAGE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.STORAGE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
