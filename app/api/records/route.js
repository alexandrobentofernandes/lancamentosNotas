import { NextResponse } from 'next/server';
import { requireAuth, canWrite } from '../../../lib/auth';
import { getAllRecords, createRecord, bulkImportRecords } from '../../../lib/db';
import { applyBusinessRules } from '../../../lib/business';
import { addAudit } from '../../../lib/db';

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

  // Filtrar por cliente
  if (user.clienteId) filters.clienteId = user.clienteId;

  const records = await getAllRecords(filters);
  return NextResponse.json(records);
}

export async function POST(req) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!canWrite(user)) return NextResponse.json({ error: 'Sem permissão de escrita' }, { status: 403 });

  const body = await req.json();

  // Bulk import
  if (Array.isArray(body)) {
    const count = await bulkImportRecords(body);
    await addAudit(user.username, 'BULK_IMPORT', `${count} registros importados`);
    return NextResponse.json({ imported: count });
  }

  // Single record
  const data = applyBusinessRules(body);
  data.createdBy = user.nome;
  if (user.clienteId) data.clienteId = user.clienteId;
  const record = await createRecord(data);
  await addAudit(user.username, 'CREATE', record.id, record.nomes);
  return NextResponse.json(record, { status: 201 });
}
