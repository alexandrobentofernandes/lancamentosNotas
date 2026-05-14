import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../../lib/auth';
import { getAllUsers, createUser, updateUser } from '../../../lib/db';

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'SYSTEM' && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const users = await getAllUsers();
  return NextResponse.json(users);
}

export async function POST(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'SYSTEM' && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const body = await req.json();
  if (!body.username || !body.password || !body.nome)
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  if (body.role === 'SYSTEM' && user.role !== 'SYSTEM')
    return NextResponse.json({ error: 'Apenas SYSTEM pode criar outros SYSTEM' }, { status: 403 });
  const existing = (await getAllUsers()).find(u => u.username === body.username);
  if (existing) return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 });
  const newUser = await createUser({ ...body, password: bcrypt.hashSync(body.password, 10) });
  return NextResponse.json(newUser, { status: 201 });
}

export async function PUT(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'SYSTEM' && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  if (data.password) data.password = bcrypt.hashSync(data.password, 10);
  else delete data.password;
  const updated = await updateUser(id, data);
  if (!updated) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  return NextResponse.json(updated);
}
