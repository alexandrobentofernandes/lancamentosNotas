import { NextResponse } from 'next/server';
import { requireAuth, PERMISSOES } from '../../../lib/auth';
import { getClientes, getCliente, createCliente, updateCliente, deleteCliente, recalcularSlots, addAudit } from '../../../lib/db';

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.CLIENTE_VER(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const cli = await getCliente(id);
    if (!cli) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(cli);
  }

  const clientes = await getClientes();
  return NextResponse.json(clientes);
}

export async function POST(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.CLIENTE_EDITAR(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json();
  if (!body.nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const cliente = await createCliente({
    nome: body.nome,
    documento: body.documento || '',
    email: body.email || '',
    contato: body.contato || '',
    slotsTotal: parseInt(body.slotsTotal) || 0,
    valorSlot: parseFloat(body.valorSlot) || 0,
    status: 'ATIVO',
    createdBy: user.nome,
  });

  await addAudit(user.username, 'CLIENTE_CREATE', cliente.id, cliente.nome);
  return NextResponse.json(cliente, { status: 201 });
}

export async function PUT(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.CLIENTE_EDITAR(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const updateData = { ...data, updatedBy: user.nome };
  if (data.slotsTotal !== undefined) updateData.slotsTotal = parseInt(data.slotsTotal) || 0;
  if (data.valorSlot !== undefined) updateData.valorSlot = parseFloat(data.valorSlot) || 0;
  if (data.status) updateData.status = data.status;

  const updated = await updateCliente(id, updateData);
  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  if (data.slotsTotal !== undefined) await recalcularSlots(id);
  await addAudit(user.username, 'CLIENTE_UPDATE', id, updated.nome);
  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'SYSTEM') return NextResponse.json({ error: 'Apenas SYSTEM pode excluir' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const cli = await getCliente(id);
  if (!cli) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  await deleteCliente(id);
  await addAudit(user.username, 'CLIENTE_DELETE', id, cli.nome);
  return NextResponse.json({ ok: true });
}
