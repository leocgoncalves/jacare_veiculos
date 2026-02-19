import nodemailer from "nodemailer";

type SendPasswordResetEmailParams = {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type SendMailResult = {
  sent: boolean;
};

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? "587");
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM ?? "nao-responda@jacareveiculos.com.br";
const smtpSecure =
  process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465;

let transport: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  if (!transport) {
    transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return transport;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes,
}: SendPasswordResetEmailParams): Promise<SendMailResult> {
  const transporter = getTransporter();

  if (!transporter) {
    console.info(`[password-reset] SMTP não configurado. E-mail de reset não enviado.`);
    return { sent: false };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111318;">
      <h2>Recuperação de senha</h2>
      <p>Olá, ${name}.</p>
      <p>Recebemos uma solicitação para redefinir sua senha no Jacaré Veículos.</p>
      <p>
        <a
          href="${resetUrl}"
          style="display:inline-block;padding:10px 16px;background:#0f3d2e;color:#ffffff;text-decoration:none;border-radius:8px;"
        >
          Redefinir minha senha
        </a>
      </p>
      <p>Este link expira em ${expiresInMinutes} minutos.</p>
      <p>Se você não solicitou essa ação, ignore este e-mail.</p>
    </div>
  `;

  const text = [
    `Olá, ${name}.`,
    "Recebemos uma solicitação para redefinir sua senha no Jacaré Veículos.",
    `Use este link para redefinir: ${resetUrl}`,
    `Este link expira em ${expiresInMinutes} minutos.`,
    "Se você não solicitou essa ação, ignore este e-mail.",
  ].join("\n");

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "Jacaré Veículos - Redefinição de senha",
    text,
    html,
  });

  return { sent: true };
}
