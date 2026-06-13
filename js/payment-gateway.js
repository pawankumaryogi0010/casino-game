import { supabase } from './supabase-config.js';
// All money mutations go through trusted RPC — never a direct table write.
export async function deposit(amount) {
  const { data, error } = await supabase.rpc('mock_deposit', { p_amount: amount });
  if (error) throw error;
  return data; // new balance
}
export async function withdraw(amount) {
  const { data, error } = await supabase.rpc('mock_withdraw', { p_amount: amount });
  if (error) throw error;
  return data;
}
