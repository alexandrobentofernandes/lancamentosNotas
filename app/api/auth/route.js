import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from '../../../lib/db';
import { signToken } from '../../../lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return NextResponse.json({ error: 'Usuário e senha obrigatórios' }, { status: 400 });

    const user = await getUserByUsername(username);
    if (!user || !user.active)
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid)
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });

    const token = signToken({
      id: user.id, username: user.username, nome: user.nome,
      role: user.role, permissions: user.permissions
    });

    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username, nome: user.nome, role: user.role, permissions: user.permissions }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
