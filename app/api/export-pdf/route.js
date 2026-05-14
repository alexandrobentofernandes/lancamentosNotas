import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getAllRecords, getRecord } from '../../../lib/db';
import { jsPDF } from 'jspdf';

export async function GET(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  let record;
  if (id) {
    record = await getRecord(id);
    if (!record) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  } else {
    const filters = {};
    if (user.clienteId) filters.clienteId = user.clienteId;
    const records = await getAllRecords(filters);
    record = records[0];
    if (!record) return NextResponse.json({ error: 'Nenhum registro' }, { status: 404 });
  }

  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageW = 190, left = 10;
  let y = 15;

  const title = (t, s = 18) => { doc.setFontSize(s); doc.setTextColor(89, 48, 226); doc.text(t, left, y); y += 8; };
  const section = (t) => { doc.setFontSize(11); doc.setTextColor(100, 100, 100); doc.text(t, left, y); y += 5; doc.setDrawColor(89, 48, 226); doc.line(left, y, left + pageW, y); y += 5; };
  const field = (l, v) => { doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.text(l + ':', left, y); doc.setFontSize(10); doc.setTextColor(20, 20, 20); doc.text(String(v || '—'), left + 35, y); y += 5; };

  title('Ficha de Avaliação', 20);
  doc.setFontSize(10); doc.setTextColor(150, 150, 150);
  doc.text(`ID: ${record.id?.slice(0, 20) || '—'}`, left, y); y += 10;

  section('Identificação');
  field('Nome', record.nomes); field('CPF', record.cpf); field('Matrícula', record.matricula);
  field('Empresa', record.empresa); field('Base', record.base); field('Processo', record.processo?.replace(/_/g, ' '));
  field('Data', record.dataRealizacao); field('Pedido', record.pedido); field('Turma', record.turma);
  field('Avaliador', record.avaliador); y += 5;

  if (record.notaProva) {
    section('Prova Teórica');
    field('Nota', record.notaProva); field('Status', record.statusProvaTeorica); y += 5;
  }

  section('Resultado');
  field('Status Parcial', record.statusParcial);
  field('Resultado Final', record.resultadoFinal);
  field('HAR', record.har); y += 10;

  doc.setFontSize(8); doc.setTextColor(180, 180, 180);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} por ${user.nome}`, left, 290);
  if (record.createdBy) doc.text(`Criado por ${record.createdBy} · ${(record.createdAt || '').slice(0, 10)}`, left, 294);

  const buf = Buffer.from(doc.output('arraybuffer'));
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="avaliacao_${(record.nomes || 'sem_nome').replace(/\s+/g, '_')}.pdf"`
    }
  });
}
