#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const patterns = [
  /sk-[A-Za-z0-9]{20,}/g,
  /SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*['\"]?[A-Za-z0-9._-]{20,}/gi,
  /OPENAI_API_KEY\s*[=:]\s*['\"]?[A-Za-z0-9._-]{20,}/gi,
  /NATIONAL_LAW_API_KEY\s*[=:]\s*['\"]?[A-Za-z0-9._-]{6,}/gi,
  /ADMIN_PASSWORD\s*[=:]\s*['\"].+['\"]/gi,
  /\bOC=([A-Za-z0-9_\-]{4,})\b/g,
];

const allowlist = [
  '.env.example',
  '.github/workflows/discovery-maintenance.yml',
  'src/lib/settings.ts',
  'docs/SCHEMA.md',
];

function getTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}

let found = [];
for (const file of getTrackedFiles()) {
  if (allowlist.includes(file)) continue;
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const p of patterns) {
      p.lastIndex = 0;
      if (p.test(line)) {
        found.push(`${file}:${idx + 1}:${line.trim().slice(0, 180)}`);
        break;
      }
    }
  });
}

if (found.length) {
  console.error('Potential secrets found:');
  found.forEach((x) => console.error(`- ${x}`));
  process.exit(1);
}

console.log('Secret scan passed');