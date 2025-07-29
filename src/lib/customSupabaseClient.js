import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvckvyvhlyxweijzwbrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Y2t2eXZobHl4d2Vpanp3YnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTk0NjgsImV4cCI6MjA2ODY3NTQ2OH0.ExP68ssmwpicxSSylLGrdTh5tgVAKBGZzThqxr93Bvk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);