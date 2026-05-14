import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'ceo_cabofrio_secret_mude_em_producao_2026';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

export function getTokenFromRequest(req) {
  const auth = req.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function canWrite(user) {
  return user.role === 'SYSTEM' || user.role === 'ADMIN' || user.tipo === 'admin_cliente' ||
    (user.role === 'COLABORADOR' && user.permissions === 'Leitura + Escrita');
}

export function isAdmin(user) {
  return user.role === 'SYSTEM' || user.tipo === 'admin_cliente' || user.role === 'ADMIN';
}

export const PERMISSOES = {
  CLIENTE_VER: u => u.role === 'SYSTEM',
  CLIENTE_EDITAR: u => u.role === 'SYSTEM',
  USUARIOS_VER: u => u.role === 'SYSTEM' || u.tipo === 'admin_cliente' || u.role === 'ADMIN',
  USUARIOS_CRIAR: u => u.role === 'SYSTEM' || u.tipo === 'admin_cliente' || u.role === 'ADMIN',
  LICENCAS_VER: u => u.role === 'SYSTEM' || u.tipo === 'admin_cliente',
  LICENCAS_SOLICITAR: u => u.tipo === 'admin_cliente',
  LICENCAS_APROVAR: u => u.role === 'SYSTEM',
  RECORDS_TODOS: u => u.role === 'SYSTEM' || u.tipo === 'admin_cliente' || u.role === 'ADMIN',
};
