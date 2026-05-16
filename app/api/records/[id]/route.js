import { NextResponse } from 'next/server';
import { requireAuth, canWrite } from '../../../../lib/auth';
import { getRecord, updateRecord, deleteRecord, addAudit, getAllRecords } from '../../../../lib/db';
import { applyBusinessRules } from '../../../../lib/business';

export async function GET(req, { params }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const record = await getRecord(params.id);
  if (!record) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(req, { params }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!canWrite(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const body = await req.json();
  const data = applyBusinessRules(body);
  if (data.nomes && data.cpf) {
    const all = await getAllRecords({});
    const dup = all.find(r => r.nomes===data.nomes && r.cpf===data.cpf && r.id!==params.id);
    if (dup) return NextResponse.json({ error: `Avaliação duplicada: "${data.nomes}" já existe (CPF: ${data.cpf})` }, { status: 409 });
  }
  data.updatedBy = user.nome;
  if (user.clienteId) data.clienteId = user.clienteId;
  const record = await updateRecord(params.id, data);
  if (!record) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  await addAudit(user.username, 'UPDATE', params.id, record.nomes);
  return NextResponse.json(record);
}

export async function DELETE(req, { params }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!canWrite(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  if (user.role !== 'SYSTEM' && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Apenas admins podem excluir' }, { status: 403 });
  const record = await getRecord(params.id);
  if (!record) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  await deleteRecord(params.id);
  await addAudit(user.username, 'DELETE', params.id, record.nomes);
  return NextResponse.json({ ok: true });
}
