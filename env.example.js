// env.example.js  -  copy to env.js (which is git-ignored) for local dev,
// OR generate env.js at build time on Vercel from environment variables.
//
// The ANON key is the PUBLIC (publishable) key. Never put the
// service_role key here; it must never reach the browser.
window.env = {
  SUPABASE_URL: 'https://YOUR-PROJECT-REF.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-PUBLIC-ANON-KEY',
};
