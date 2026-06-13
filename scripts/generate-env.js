// scripts/generate-env.js
// Runs at build time on Vercel to write env.js from environment variables.
// Configure Vercel "Build Command": node scripts/generate-env.js
// (or chain it: node scripts/generate-env.js && <your build>)
//
// Set these in Vercel > Project > Settings > Environment Variables:
//   SUPABASE_URL        = https://YOUR-PROJECT-REF.supabase.co
//   SUPABASE_ANON_KEY   = <your public anon key>
const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const anon = process.env.SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  console.error('generate-env: SUPABASE_URL and SUPABASE_ANON_KEY must be set in the environment.');
  process.exit(1);
}

const out = 'window.env = ' + JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: anon }, null, 2) + ';\n';
fs.writeFileSync('env.js', out);
console.log('generate-env: wrote env.js');
