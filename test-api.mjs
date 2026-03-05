import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const passenger_id = 146;

    // Simulate passenger sending a message
    const res = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            passenger_id,
            text: 'hello again',
            sender: 'passenger'
        })
    });

    const json = await res.json();
    console.log('Result:', json);

    // Read back the messages to see if old ones were updated
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('passenger_id', passenger_id)
        .order('timestamp', { ascending: false })
        .limit(5);

    console.log("Updated Messages:");
    console.table(messages);
}
main();
