import { NextResponse } from 'next/server';
import { requireAuth, canWrite } from '../../../lib/auth';
import { getCadastros, createCadastro, updateCadastro, deleteCadastro, getCadastro, addAudit } from '../../../lib/db';

const TIPOS_VALIDOS = ['pedidos','empresas','processos','bases','avaliadores','motivos','candidatos'];

async function checkDuplicata(tipo, data, ignoreId) {
  const itens = await getCadastros(tipo);
  return itens.some(item => {
    if (ignoreId && item.id === ignoreId) return false;
    if (tipo === 'candidatos') return (item.nome||'')===(data.nome||'') && (item.cpf||'')===(data.cpf||'');
    if (tipo === 'processos') return (item.processo||'')===(data.processo||'') && (item.atividade||'')===(data.atividade||'');
    if (tipo === 'bases') return (item.base||'')===(data.base||'');
    return (item.nome||'')===(data.nome||'');
  });
}

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo');
  const id = searchParams.get('id');

  if (id) {
    const item = await getCadastro(id);
    if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(item);
  }

  if (!tipo || !TIPOS_VALIDOS.includes(tipo))
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  const items = await getCadastros(tipo);
  return NextResponse.json(items);
}

export async function POST(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!canWrite(user)) return NextResponse.json({ error: 'Sem permissão de escrita' }, { status: 403 });

  const body = await req.json();

  // Bulk delete via POST
  if (body._bulkDelete) {
    if (user.role !== 'SYSTEM' && user.role !== 'ADMIN')
      return NextResponse.json({ error: 'Apenas admins podem excluir' }, { status: 403 });
    const ids = body._bulkDelete;
    let ok = 0, err = 0;
    await Promise.all(ids.map(async id => {
      const item = await getCadastro(id);
      if (!item) { err++; return; }
      await deleteCadastro(id);
      await addAudit(user.username, 'CADASTRO_DELETE', id, `${item.tipo}: ${item.nome || id}`);
      ok++;
    }));
    return NextResponse.json({ ok, err });
  }

  const { tipo, ...data } = body;
  if (!tipo || !TIPOS_VALIDOS.includes(tipo))
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  if (await checkDuplicata(tipo, data))
    return NextResponse.json({ error: 'Já existe um registro com os mesmos dados' }, { status: 409 });

  const item = await createCadastro(tipo, { ...data, createdBy: user.nome });
  await addAudit(user.username, 'CADASTRO_CREATE', item.id, `${tipo}: ${data.nome || data[Object.keys(data)[0]]}`);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!canWrite(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id, tipo:updTipo, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const existing = await getCadastro(id);
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  if (await checkDuplicata(existing.tipo, data, id))
    return NextResponse.json({ error: 'Já existe outro registro com os mesmos dados' }, { status: 409 });

  const updated = await updateCadastro(id, { ...data, updatedBy: user.nome });
  await addAudit(user.username, 'CADASTRO_UPDATE', id, `${updated.tipo}: ${data.nome || data[Object.keys(data)[0]] || id}`);
  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'SYSTEM' && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Apenas admins podem excluir' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const item = await getCadastro(id);
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  await deleteCadastro(id);
  await addAudit(user.username, 'CADASTRO_DELETE', id, `${item.tipo}: ${item.nome || id}`);
  return NextResponse.json({ ok: true });
}
