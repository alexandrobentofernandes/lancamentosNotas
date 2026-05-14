import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername, getCliente } from '../../../lib/db';
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

    // Verificar licença para admin_cliente
    if (user.tipo === 'admin_cliente' && user.clienteId) {
      const cli = await getCliente(user.clienteId);
      if (!cli) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 401 });
      if (cli.slotsTotal < 1) return NextResponse.json({ error: 'Cliente sem licenças disponíveis. Contate o suporte.' }, { status: 403 });
    }

    const token = signToken({
      id: user.id, username: user.username, nome: user.nome,
      role: user.role, tipo: user.tipo, clienteId: user.clienteId,
      permissions: user.permissions
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id, username: user.username, nome: user.nome,
        role: user.role, tipo: user.tipo, clienteId: user.clienteId,
        permissions: user.permissions
      }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
