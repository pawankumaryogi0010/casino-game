import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(
  window.ENV.SUPABASE_URL,        // public anon URL/key are safe to expose
  window.ENV.SUPABASE_ANON_KEY,   // RLS is what protects you, not key secrecy
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// Lobby presence + live round updates, shared across games
export function subscribeRound(roundId, onChange) {
  return supabase
    .channel(`round:${roundId}`)
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${roundId}` },
        ({ new: row }) => onChange(row))
    .subscribe();
}
