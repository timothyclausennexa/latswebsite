import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecjczgwzzqinulbmsvkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjamN6Z3d6enFpbnVsYm1zdmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQxNDUsImV4cCI6MjA3MzYwMDE0NX0.26P6Or0GwelKBziyAlXbKTh7ryHgh99wBz9Ll7BguS8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
    console.log('Checking database tables...\n');

    // Check site_config table
    console.log('1. Checking site_config table:');
    const { data: siteConfig, error: siteConfigError } = await supabase
        .from('site_config')
        .select('*');

    if (siteConfigError) {
        console.log('   Error:', siteConfigError.message);
    } else {
        console.log('   Found', siteConfig?.length || 0, 'rows');
        if (siteConfig?.length > 0) {
            console.log('   Data:', JSON.stringify(siteConfig, null, 2));
        }
    }

    // Check admin_users table
    console.log('\n2. Checking admin_users table:');
    const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('*');

    if (adminError) {
        console.log('   Error:', adminError.message);
    } else {
        console.log('   Found', adminUsers?.length || 0, 'admin users');
        if (adminUsers?.length > 0) {
            console.log('   Data:', JSON.stringify(adminUsers, null, 2));
        }
    }

    // Check auth users
    console.log('\n3. Checking auth users:');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.log('   Note: Cannot list users with anon key (this is normal)');
    } else if (users) {
        console.log('   Found', users.length, 'users');
        users.forEach(user => {
            console.log(`   - ${user.email} (ID: ${user.id})`);
        });
    }

    console.log('\nDatabase check complete!');
}

checkDatabase().catch(console.error);