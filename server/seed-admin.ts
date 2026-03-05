import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly as we are running a script
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seed() {
    console.log('Checking for admin user shafeez@macl.aero...');

    // First, list users
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error.message);
        process.exit(1);
    }

    const existingAdmin = users.users.find((u: any) => u.email === 'shafeez@macl.aero');
    if (existingAdmin) {
        console.log('Admin user already exists:', existingAdmin.id);

        // Ensure role is admin
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingAdmin.id, {
            app_metadata: { ...existingAdmin.app_metadata, role: 'admin', active: 1 },
            user_metadata: { display_name: 'Ahmed Shafeez' }
        });

        if (updateError) {
            console.error('Error updating existing admin user role:', updateError.message);
        } else {
            console.log('Updated existing admin user role successfully.');
        }
        process.exit(0);
    }

    // Create new admin
    console.log('Creating new admin user...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'shafeez@macl.aero',
        password: 'Maldives123',
        email_confirm: true,
        user_metadata: { display_name: 'Ahmed Shafeez' },
        app_metadata: { role: 'admin', active: 1 }
    });

    if (createError) {
        console.error('Error creating admin user:', createError.message);
        process.exit(1);
    }

    console.log('Successfully created admin user:', newUser.user.id);
}

seed();
