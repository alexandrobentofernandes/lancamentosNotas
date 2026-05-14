import nodemailer from 'nodemailer';

const NOTIFICACAO_EMAIL = 'tecnologia@patyservice.com';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to = NOTIFICACAO_EMAIL, subject, text, html }) {
  const t = await getTransporter();
  if (!t) {
    console.log(`[EMAIL SIMULADO] Para: ${to} | Assunto: ${subject} | ${text}`);
    return { simulated: true };
  }
  try {
    await t.sendMail({ from: process.env.SMTP_FROM || to, to, subject, text, html });
    return { ok: true };
  } catch (e) {
    console.error('Erro ao enviar email:', e);
    return { error: e.message };
  }
}

export async function notificarSolicitacaoLicenca({ clienteNome, quantidade, motivo, solicitante, emailSolicitante }) {
  return sendEmail({
    subject: `[Licenças] Nova solicitação de ${clienteNome}`,
    text: `Nova solicitação de licenças:\n\nCliente: ${clienteNome}\nQuantidade: ${quantidade}\nMotivo: ${motivo || '—'}\nSolicitante: ${solicitante} (${emailSolicitante})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f6fa;border-radius:12px">
        <div style="background:linear-gradient(135deg,#5930E2,#7C5CFF);color:#fff;padding:20px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:18px">Nova Solicitação de Licenças</h2>
        </div>
        <div style="background:#fff;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666;font-size:13px">Cliente</td><td style="padding:8px 0;font-weight:600;font-size:14px">${clienteNome}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:13px">Quantidade</td><td style="padding:8px 0;font-weight:600;font-size:14px;color:#5930E2">+${quantidade} licenças</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:13px">Motivo</td><td style="padding:8px 0;font-size:14px">${motivo || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:13px">Solicitante</td><td style="padding:8px 0;font-size:14px">${solicitante}</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-size:13px">Email</td><td style="padding:8px 0;font-size:14px">${emailSolicitante}</td></tr>
          </table>
          <p style="margin-top:16px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:12px;color:#999">
            Acesse o sistema para aprovar ou negar esta solicitação.
          </p>
        </div>
      </div>
    `,
  });
}
