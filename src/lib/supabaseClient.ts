import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecjczgwzzqinulbmsvkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjamN6Z3d6enFpbnVsYm1zdmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQxNDUsImV4cCI6MjA3MzYwMDE0NX0.26P6Or0GwelKBziyAlXbKTh7ryHgh99wBz9Ll7BguS8';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
