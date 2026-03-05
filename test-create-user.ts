import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const ts = Date.now();
    const res = await supabaseAdmin.auth.admin.createUser({
        email: `test-${ts}@example.com`,
        password: 'Password123',
        email_confirm: true,
        user_metadata: { display_name: 'Test Create' },
        app_metadata: { role: 'staff', active: 1 }
    });
    console.log("Success:", !!res.data.user);
    if(res.error) console.error(res.error);
}
run();
