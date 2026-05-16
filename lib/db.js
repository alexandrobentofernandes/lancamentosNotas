import { Redis } from '@upstash/redis';

let kvInstance = null;
const memStore = new Map();

function getKV() {
  if (kvInstance) return kvInstance;
  try {
    if (typeof process === 'object' && process?.env?.UPSTASH_REDIS_REST_URL) {
      kvInstance = Redis.fromEnv();
      return kvInstance;
    }
  } catch {}
  return null;
}

async function kvGet(key) {
  const kv = getKV();
  if (kv) return await kv.get(key);
  return memStore.get(key) ?? null;
}

async function kvSet(key, value) {
  const kv = getKV();
  if (kv) return await kv.set(key, value);
  memStore.set(key, value);
}

async function kvDel(key) {
  const kv = getKV();
  if (kv) return await kv.del(key);
  memStore.delete(key);
}

async function kvSmembers(key) {
  const kv = getKV();
  if (kv) return await kv.smembers(key) || [];
  return memStore.get(key) || [];
}

async function kvSadd(key, ...members) {
  const kv = getKV();
  if (kv) return await kv.sadd(key, ...members);
  const set = memStore.get(key) || [];
  members.forEach(m => { if (!set.includes(m)) set.push(m); });
  memStore.set(key, set);
}

async function kvSrem(key, ...members) {
  const kv = getKV();
  if (kv) return await kv.srem(key, ...members);
  const set = (memStore.get(key) || []).filter(m => !members.includes(m));
  memStore.set(key, set);
}

// ─── USERS ─────────────────────────────────────────────────────────────────
async function initDefaultUsers() {
  const ids = await kvSmembers('users:all');
  if (ids.length > 0) return;
  const defaults = [
    { id: 'usr_system', username: 'system', password: bcrypt.hashSync('system@2026', 10), nome: 'System Master', role: 'SYSTEM', tipo: 'system', permissions: null, active: true },
  ];
  for (const u of defaults) {
    await kvSet(`user:${u.id}`, u);
    await kvSet(`user:uname:${u.username}`, u.id);
    await kvSadd('users:all', u.id);
  }
}

export async function getUserByUsername(username) {
  await initDefaultUsers();
  const id = await kvGet(`user:uname:${username}`);
  if (!id) return null;
  return await kvGet(`user:${id}`);
}

export async function getAllUsers() {
  await initDefaultUsers();
  const ids = await kvSmembers('users:all');
  const users = await Promise.all(ids.map(id => kvGet(`user:${id}`)));
  return users.filter(Boolean).map(u => ({ ...u, password: undefined }));
}

export async function createUser(data) {
  const id = `usr_${Date.now()}`;
  const user = { ...data, id, active: true };
  await kvSet(`user:${id}`, user);
  await kvSet(`user:uname:${data.username}`, id);
  await kvSadd('users:all', id);
  return { ...user, password: undefined };
}

export async function updateUser(id, data) {
  const existing = await kvGet(`user:${id}`);
  if (!existing) return null;
  if (data.username && data.username !== existing.username) {
    await kvDel(`user:uname:${existing.username}`);
    await kvSet(`user:uname:${data.username}`, id);
  }
  const updated = { ...existing, ...data, id };
  await kvSet(`user:${id}`, updated);
  return { ...updated, password: undefined };
}

export async function deleteUser(id) {
  const user = await kvGet(`user:${id}`);
  if (!user) return null;
  await kvDel(`user:${id}`);
  await kvDel(`user:uname:${user.username}`);
  await kvSrem('users:all', id);
  if (user.clienteId) await recalcularSlots(user.clienteId);
  return user;
}

// ─── RECORDS ────────────────────────────────────────────────────────────────
export async function getAllRecords(filters = {}) {
  const ids = await kvSmembers('records:all');
  let records = await Promise.all(ids.map(id => kvGet(`record:${id}`)));
  records = records.filter(Boolean);
  if (filters.clienteId) records = records.filter(r => r.clienteId === filters.clienteId);
  if (filters.base) records = records.filter(r => r.base === filters.base);
  if (filters.resultado) records = records.filter(r => r.resultadoFinal === filters.resultado);
  if (filters.empresa) records = records.filter(r => r.empresa === filters.empresa);
  if (filters.dtIni) records = records.filter(r => r.dataRealizacao >= filters.dtIni);
  if (filters.dtFim) records = records.filter(r => r.dataRealizacao <= filters.dtFim);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    records = records.filter(r => (r.nomes||'').toLowerCase().includes(q) || (r.cpf||'').includes(q) || (r.empresa||'').toLowerCase().includes(q) || (r.turma||'').toLowerCase().includes(q));
  }
  return records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function countRecords(clienteId) {
  const ids = await kvSmembers('records:all');
  let records = await Promise.all(ids.map(id => kvGet(`record:${id}`)));
  records = records.filter(Boolean);
  if (clienteId) records = records.filter(r => r.clienteId === clienteId);
  return records.length;
}

export async function getRecord(id) {
  return await kvGet(`record:${id}`);
}

export async function createRecord(data) {
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record = { ...data, id, createdAt: new Date().toISOString() };
  await kvSet(`record:${id}`, record);
  await kvSadd('records:all', id);
  return record;
}

export async function updateRecord(id, data) {
  const existing = await kvGet(`record:${id}`);
  if (!existing) return null;
  const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  await kvSet(`record:${id}`, updated);
  return updated;
}

export async function deleteRecord(id) {
  await kvDel(`record:${id}`);
  await kvSrem('records:all', id);
}

export async function bulkImportRecords(records) {
  const ids = await kvSmembers('records:all');
  const existingIds = new Set(ids);
  let count = 0;
  for (const rec of records) {
    const id = rec.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (!existingIds.has(id)) {
      await kvSet(`record:${id}`, { ...rec, id });
      await kvSadd('records:all', id);
      existingIds.add(id);
      count++;
    }
  }
  return count;
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export async function getClientes() {
  const ids = await kvSmembers('clientes:all');
  let items = await Promise.all(ids.map(id => kvGet(`cliente:${id}`)));
  return items.filter(Boolean).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
}

export async function getCliente(id) {
  return await kvGet(`cliente:${id}`);
}

export async function createCliente(data) {
  const id = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const cliente = { ...data, id, slotsUsados: 0, createdAt: new Date().toISOString() };
  await kvSet(`cliente:${id}`, cliente);
  await kvSadd('clientes:all', id);
  return cliente;
}

export async function updateCliente(id, data) {
  const existing = await kvGet(`cliente:${id}`);
  if (!existing) return null;
  const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  await kvSet(`cliente:${id}`, updated);
  return updated;
}

export async function deleteCliente(id) {
  const users = await kvSmembers('users:all');
  for (const uid of users) {
    const u = await kvGet(`user:${uid}`);
    if (u && u.clienteId === id) {
      await kvDel(`user:${uid}`);
      await kvSrem('users:all', uid);
    }
  }
  await kvDel(`cliente:${id}`);
  await kvSrem('clientes:all', id);
}

export async function recalcularSlots(clienteId) {
  const ids = await kvSmembers('users:all');
  let count = 0;
  for (const uid of ids) {
    const u = await kvGet(`user:${uid}`);
    if (u && u.clienteId === clienteId && u.active !== false) count++;
  }
  await updateCliente(clienteId, { slotsUsados: count });
  return count;
}

// ─── LICENÇA REQUESTS ────────────────────────────────────────────────────────
export async function getLicencaRequests() {
  const ids = await kvSmembers('licencas:requests:all');
  let items = await Promise.all(ids.map(id => kvGet(`licenca:request:${id}`)));
  return items.filter(Boolean).sort((a, b) => ((b.createdAt||'') > (a.createdAt||'') ? 1 : -1));
}

export async function createLicencaRequest(data) {
  const id = `lrq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const req = { ...data, id, status: 'PENDENTE', createdAt: new Date().toISOString() };
  await kvSet(`licenca:request:${id}`, req);
  await kvSadd('licencas:requests:all', id);
  return req;
}

export async function updateLicencaRequest(id, data) {
  const existing = await kvGet(`licenca:request:${id}`);
  if (!existing) return null;
  const updated = { ...existing, ...data, id };
  await kvSet(`licenca:request:${id}`, updated);
  return updated;
}

// ─── CADASTROS (Tabelas Auxiliares) ──────────────────────────────────────────

export async function getCadastros(tipo) {
  const ids = await kvSmembers(`cadastro:${tipo}:all`);
  let items = await Promise.all(ids.map(id => kvGet(`cadastro:${id}`)));
  return items.filter(Boolean).sort((a, b) => (a.processo || a.nome || a.base || a.id || '').localeCompare(b.processo || b.nome || b.base || b.id || ''));
}

export async function getCadastro(id) {
  return await kvGet(`cadastro:${id}`);
}

export async function createCadastro(tipo, data) {
  const id = `cad_${tipo}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item = { ...data, id, tipo, createdAt: new Date().toISOString() };
  await kvSet(`cadastro:${id}`, item);
  await kvSadd(`cadastro:${tipo}:all`, id);
  return item;
}

export async function updateCadastro(id, data) {
  const existing = await kvGet(`cadastro:${id}`);
  if (!existing) return null;
  const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  await kvSet(`cadastro:${id}`, updated);
  return updated;
}

export async function deleteCadastro(id) {
  const item = await kvGet(`cadastro:${id}`);
  if (!item) return;
  await kvDel(`cadastro:${id}`);
  await kvSrem(`cadastro:${item.tipo}:all`, id);
}

// ─── AUDIT ───────────────────────────────────────────────────────────────────
export async function addAudit(username, action, detail) {
  const id = `audit_${Date.now()}`;
  await kvSet(`audit:${id}`, { id, username, action, detail, ts: new Date().toISOString() });
  await kvSadd('audit:all', id);
}

export async function getAudit(limit = 50) {
  const ids = (await kvSmembers('audit:all')).slice(-limit).reverse();
  const entries = await Promise.all(ids.map(id => kvGet(`audit:${id}`)));
  return entries.filter(Boolean).reverse();
}
