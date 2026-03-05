import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: 'SELECT 1;' });
  console.log(data, error);
  const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
  console.log(d2, e2);
}
run();
