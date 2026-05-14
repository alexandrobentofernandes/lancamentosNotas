import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getAllRecords, getClientes } from '../../../lib/db';
import * as XLSX from 'xlsx';

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

  const data = records.map((r, i) => {
    const row = { '#': i + 1 };
    cols.forEach(c => { row[c] = r[c] || ''; });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');

  // Ajustar largura das colunas
  ws['!cols'] = cols.map(c => ({ wch: c === 'nomes' ? 30 : c === 'cpf' ? 16 : c === 'empresa' || c === 'base' ? 22 : 18 }));

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="avaliacoes_CEO_${new Date().toISOString().slice(0,10)}.xlsx"`
    }
  });
}
