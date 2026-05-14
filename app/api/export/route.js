import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getAllRecords } from '../../../lib/db';

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filters = {
    q: searchParams.get('q') || '',
    base: searchParams.get('base') || '',
    resultado: searchParams.get('resultado') || '',
    empresa: searchParams.get('empresa') || '',
    dtIni: searchParams.get('dtIni') || '',
    dtFim: searchParams.get('dtFim') || '',
  };
  if (user.clienteId) filters.clienteId = user.clienteId;

  const records = await getAllRecords(filters);
  const cols = ['nomes','cpf','empresa','base','processo','dataRealizacao','pedido','turma','avaliador','notaProva','statusProvaTeorica','avaliacao1','statusProva1','motivo1','avaliacao2','statusProva2','motivo2','avaliacao3','statusProva3','motivo3','avaliacao4','statusProva4','motivo4','statusParcial','resultadoFinal','har','localAvaliacao','emailEmpresa','docContratual','isbn'];
  const headers = cols.join(';');
  const rows = records.map(r => cols.map(c => `"${String(r[c]||'').replace(/"/g,'""')}"`).join(';'));
  const csv = '\uFEFF' + headers + '\n' + rows.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="avaliacoes_CEO_${new Date().toISOString().slice(0,10)}.csv"`
    }
  });
}
