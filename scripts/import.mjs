import fs from 'fs';

const BASE = 'http://localhost:3000';
const records = JSON.parse(fs.readFileSync('seed-processos.json', 'utf-8'));

async function main() {
  // Login
  const authRes = await fetch(BASE + '/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'system', password: 'system@2026' })
  });
  const auth = await authRes.json();
  if (auth.error) { console.error('Auth error:', auth.error); process.exit(1); }
  const token = auth.token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

  // import bulk - send all at once as array (supported by POST /api/cadastros)
  const body = records.map(r => ({ tipo: 'processos', ...r }));
  
  // Send individually to avoid payload limits
  let ok = 0, fail = 0;
  for (const rec of body) {
    const res = await fetch(BASE + '/api/cadastros', {
      method: 'POST',
      headers,
      body: JSON.stringify(rec)
    });
    const data = await res.json();
    if (data.error) {
      // skip duplicates
      if (data.error.includes('já existe') || data.error.includes('duplicate')) { ok++; continue; }
      fail++;
    } else {
      ok++;
    }
  }

  console.log(`Importados: ${ok} registros`);
  console.log(`Falhas: ${fail} registros`);
}

main().catch(console.error);
