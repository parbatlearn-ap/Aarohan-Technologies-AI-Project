// Scans tracked files for things that look like secrets. Run: npm run check-secrets
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATTERNS = [
  [/gsk_[A-Za-z0-9]{20,}/, 'Groq API key'],
  [/sb_secret_[A-Za-z0-9_-]{10,}/, 'Supabase secret key'],
  [/eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, 'JWT (Supabase key?)'],
  [/sk-[A-Za-z0-9]{20,}/, 'OpenAI-style key'],
  [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/ghp_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'Private key'],
  [/"accessToken"|"refresh_token"\s*:/, 'OAuth token field'],
];
const files = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter(f => !/\.(png|jpg|pptx|pdf)$/i.test(f) && f !== 'tests/check-secrets.mjs');
let hits = 0;
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const [re, label] of PATTERNS) {
    if (re.test(text)) { hits++; console.log(`POSSIBLE SECRET (${label}) in ${f}`); }
  }
}
console.log(hits ? `\n${hits} possible secret(s) found — review before committing.` : `No secrets found in ${files.length} files.`);
process.exit(hits ? 1 : 0);
