import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ovaqnodmgzqkllvhkcxh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gGh9ILkA9Gx8scwbatXaIg_U_mAwv5i';

export const supabase = createClient(supabaseUrl, supabaseKey);
