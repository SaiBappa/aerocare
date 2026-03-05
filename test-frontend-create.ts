import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Login as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'shafeez@macl.aero',
        password: 'Maldives123'
    });

    if (authError) {
        console.error("Login failed:", authError);
        return;
    }

    const token = authData.session.access_token;
    console.log("Logged in. Token length:", token.length);

    // Call the API endpoint
    try {
        const res = await fetch('http://localhost:3001/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                email: `newuser-${Date.now()}@example.com`,
                password: 'Password123',
                display_name: 'Frontend Test User',
                role: 'staff'
            })
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
run();
