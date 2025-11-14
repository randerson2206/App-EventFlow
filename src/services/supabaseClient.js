import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = 'https://zdgwinaipuylylwvwuwj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3dpbmFpcHV5bHlsd3Z3dXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTg0NTUsImV4cCI6MjA3ODYzNDQ1NX0.mT9OmPXrEzWmpW0uCeZ3j1urSsnRWJuB4WnsOwZmNhE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
