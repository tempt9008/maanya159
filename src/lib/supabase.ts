import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xdjwefiydpylciemipxf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkandlZml5ZHB5bGNpZW1pcHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NDE5NzcsImV4cCI6MjA0NTUxNzk3N30.Iz16bkmMtoAVUno8dLXpsT4QGyQeEpl_JZED4eBPk10';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
});

// Initialize auth state from localStorage
const initializeAuth = async () => {
  try {
    const session = localStorage.getItem('supabase.auth.token');
    if (session) {
      const { access_token } = JSON.parse(session);
      await supabase.auth.setSession({
        access_token,
        refresh_token: '',
      });
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
};

initializeAuth();