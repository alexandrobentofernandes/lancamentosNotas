import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getAudit } from '../../../lib/db';

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'SYSTEM' && user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const log = await getAudit(100);
  return NextResponse.json(log);
}
