import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth, PERMISSOES } from '../../../lib/auth';
import { getAllUsers, createUser, updateUser, deleteUser, getCliente, getClientes, recalcularSlots, addAudit } from '../../../lib/db';

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.USUARIOS_VER(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let users = await getAllUsers();

  // Admin de cliente vê apenas usuários do seu cliente
  if (user.tipo === 'admin_cliente' && user.clienteId) {
    users = users.filter(u => u.clienteId === user.clienteId);
  }

  // SYSTEM vê todos, mas vamos retornar o nome do cliente junto
  if (user.role === 'SYSTEM') {
    const clientes = await getClientes();
    const mapCli = {};
    clientes.forEach(c => { mapCli[c.id] = c.nome; });
    users = users.map(u => ({ ...u, clienteNome: mapCli[u.clienteId] || '' }));
  }

  return NextResponse.json(users);
}

export async function POST(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.USUARIOS_CRIAR(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json();
  if (!body.username || !body.password || !body.nome)
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });

  // Regras de criação
  if (body.tipo === 'system' && user.role !== 'SYSTEM')
    return NextResponse.json({ error: 'Apenas SYSTEM pode criar admins master' }, { status: 403 });

  if (body.tipo === 'admin_cliente' && user.role !== 'SYSTEM')
    return NextResponse.json({ error: 'Apenas SYSTEM pode criar admins de cliente' }, { status: 403 });

  // Admin de cliente pode criar colaboradores dentro do próprio cliente
  if (user.tipo === 'admin_cliente') {
    body.clienteId = user.clienteId;
    body.tipo = 'colaborador';
    body.role = 'COLABORADOR';
  }

  // Verificar slots disponíveis
  if (body.clienteId) {
    const cli = await getCliente(body.clienteId);
    if (cli && cli.slotsUsados >= cli.slotsTotal) {
      return NextResponse.json({ error: 'Limite de licenças atingido. Solicite mais licenças ao SYSTEM.' }, { status: 403 });
    }
  }

  let existing = (await getAllUsers()).find(u => u.username === body.username);
  if (existing) {
    if (user.tipo === 'admin_cliente' && existing.clienteId !== user.clienteId) {
      return NextResponse.json({ error: 'Nome de usuário indisponível' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 });
  }

  const newUser = await createUser({
    ...body,
    role: body.role || 'COLABORADOR',
    tipo: body.tipo || 'colaborador',
    password: bcrypt.hashSync(body.password, 10)
  });

  // Recalcular slots do cliente
  if (body.clienteId) await recalcularSlots(body.clienteId);

  await addAudit(user.username, 'USER_CREATE', newUser.id, `${newUser.nome} (${newUser.tipo})`);
  return NextResponse.json(newUser, { status: 201 });
}

export async function PUT(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!PERMISSOES.USUARIOS_CRIAR(user)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  // Admin de cliente só pode editar colaboradores do seu cliente
  if (user.tipo === 'admin_cliente') {
    const target = (await getAllUsers()).find(u => u.id === id);
    if (!target || target.clienteId !== user.clienteId)
      return NextResponse.json({ error: 'Sem permissão para editar este usuário' }, { status: 403 });
    delete data.clienteId;
    delete data.tipo;
  }

  if (data.password) data.password = bcrypt.hashSync(data.password, 10);
  else delete data.password;

  const updated = await updateUser(id, data);
  if (!updated) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  // Recalcular slots se houve mudança de status
  if (data.active !== undefined && updated.clienteId) await recalcularSlots(updated.clienteId);

  await addAudit(user.username, 'USER_UPDATE', id, updated.nome);
  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'SYSTEM') return NextResponse.json({ error: 'Apenas SYSTEM pode excluir' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const removed = await deleteUser(id);
  if (!removed) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  await addAudit(user.username, 'USER_DELETE', id, removed.nome);
  return NextResponse.json({ ok: true });
}
