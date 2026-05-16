import { NextResponse } from 'next/server';
import { requireAuth, PERMISSOES } from '../../../lib/auth';
import { getLicencaRequests, createLicencaRequest, updateLicencaRequest, getCliente, updateCliente, addAudit } from '../../../lib/db';
import { notificarSolicitacaoLicenca } from '../../../lib/email';

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.LICENCAS_VER(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const requests = await getLicencaRequests();

  // Admin vê apenas seus pedidos
  if (user.tipo === 'admin_cliente') {
    const filtered = requests.filter(r => r.clienteId === user.clienteId);
    return NextResponse.json(filtered);
  }

  return NextResponse.json(requests);
}

export async function POST(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.LICENCAS_SOLICITAR(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json();
  if (!body.quantidade) return NextResponse.json({ error: 'Quantidade obrigatória' }, { status: 400 });

  const cliente = await getCliente(user.clienteId);

  const reqData = await createLicencaRequest({
    clienteId: user.clienteId,
    clienteNome: cliente?.nome || '—',
    quantidade: parseInt(body.quantidade),
    motivo: body.motivo || '',
    solicitadoPor: user.nome,
    solicitadoPorEmail: user.username,
  });

  // Notificar SYSTEM por email
  notificarSolicitacaoLicenca({
    clienteNome: cliente?.nome || '—',
    quantidade: body.quantidade,
    motivo: body.motivo || '',
    solicitante: user.nome,
    emailSolicitante: user.username,
  });

  await addAudit(user.username, 'LICENCA_REQUEST', reqData.id, `${cliente?.nome}: ${body.quantidade} licenças`);
  return NextResponse.json(reqData, { status: 201 });
}

export async function PUT(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.LICENCAS_APROVAR(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id, status, observacao, quantidade } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const updateData = { status, observacao, analisadoPor: user.nome, analisadoEm: new Date().toISOString() };
  if (quantidade !== undefined) updateData.quantidade = parseInt(quantidade);

  const updated = await updateLicencaRequest(id, updateData);
  if (!updated) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  // Se aprovado, atualizar slots do cliente
  const qtdFinal = quantidade !== undefined ? parseInt(quantidade) : (updated.quantidade || 0);
  if (status === 'APROVADO' && updated.clienteId && qtdFinal > 0) {
    const cliente = await getCliente(updated.clienteId);
    if (cliente) {
      const novosSlots = (cliente.slotsTotal || 0) + qtdFinal;
      await updateCliente(updated.clienteId, { slotsTotal: novosSlots });
    }
  }

  await addAudit(user.username, 'LICENCA_UPDATE', id, `${status}: ${updated.clienteNome}`);
  return NextResponse.json(updated);
}
