import { NextResponse } from 'next/server';
import { requireAuth, canWrite } from '../../../lib/auth';
import { getCadastros, createCadastro, updateCadastro, deleteCadastro, getCadastro, addAudit } from '../../../lib/db';

const TIPOS_VALIDOS = ['pedidos','empresas','processos','bases','avaliadores','motivos','candidatos'];

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

  const { tipo, ...data } = await req.json();
  if (!tipo || !TIPOS_VALIDOS.includes(tipo))
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  const item = await createCadastro(tipo, { ...data, createdBy: user.nome });
  await addAudit(user.username, 'CADASTRO_CREATE', item.id, `${tipo}: ${data.nome || data[Object.keys(data)[0]]}`);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!canWrite(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const updated = await updateCadastro(id, { ...data, updatedBy: user.nome });
  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
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
