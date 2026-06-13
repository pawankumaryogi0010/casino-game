import { supabase } from './supabase-config.js';

export const auth = {
  signUp: (email, password) => supabase.auth.signUp({ email, password }),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  google: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
  logout: () => supabase.auth.signOut(),
  onChange: (cb) => supabase.auth.onAuthStateChange((_e, session) => cb(session)),
  session: () => supabase.auth.getSession(),
};
