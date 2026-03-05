/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Intercept fetch to add Supabase Auth token to API requests
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);

    if (url.includes('/api/')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            if (input instanceof Request) {
                input.headers.set('Authorization', `Bearer ${session.access_token}`);
            } else {
                init = init || {};
                init.headers = {
                    ...init.headers,
                    'Authorization': `Bearer ${session.access_token}`
                };
            }
        }
    }
    return originalFetch(input, init);
};
