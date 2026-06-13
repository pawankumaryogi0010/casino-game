import { supabase, subscribeRound } from '../supabase-config.js';
import { placeBet } from '../bets.js';

export class RoundGame {
  constructor(game) { this.game = game; this.round = null; this.timer = null; }
  async start(stage) {
    const { data } = await supabase.from('game_sessions')
      .select('*').eq('game', this.game).eq('state', 'betting').limit(1).single();
    this.round = data;
    this.channel = subscribeRound(data.id, (row) => this.onState(row)); // live deal to all clients
    this.render(stage);
    this.startCountdown(new Date(data.closes_at));
  }
  async bet(selection, amount) {
    try { await placeBet(this.round.id, amount, selection); }   // atomic server debit
    catch (e) { this.toast(e.message); }                        // 'betting closed' / 'insufficient funds'
  }
  startCountdown(end) { /* rAF tick -> update neon ring + lock UI at 0 */ }
  onState(row) { /* row.state==='resolved' -> animate winning card flip from row.result */ }
}
