import "dotenv/config";
import nodemailer from "nodemailer";

type AssignmentEmail = {
  to: string;
  leadName: string;
  leadPhone: string;
  caseType: string | null;
  urgency: string | null;
  summary?: string | null;
  notes?: string;
  acceptUrl?: string;
  rejectUrl?: string;
};

type AssignmentDecisionEmail = {
  decision: "accept" | "reject";
  attorneyName?: string | null;
  attorneyEmail?: string | null;
  leadName?: string | null;
  leadPhone?: string | null;
  caseType?: string | null;
  notes?: string | null;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} no esta configurado`);
  return v;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? "587"),
  secure: false,
  auth: {
    user: mustEnv("SMTP_USER"),
    pass: mustEnv("SMTP_PASS"),
  },
});

export async function sendAttorneyAssignmentEmail(data: AssignmentEmail) {
  const fromName = process.env.SMTP_FROM_NAME ?? "Tus Abogados 24/7";
  const fromEmail = mustEnv("SMTP_USER");
  const from = `${fromName} <${fromEmail}>`;

  console.log("[MAIL] sending SMTP...");
  console.log("[MAIL] from:", from);
  console.log("[MAIL] to:", data.to);

  const subject = `Nuevo caso asignado: ${data.caseType ?? "General"}`;
  const summary = String(data.summary ?? "").trim();
  const notes = String(data.notes ?? "").trim();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4">
      <h2>Nuevo caso asignado</h2>
      <p>Se te asigno un nuevo caso.</p>
      <ul>
        <li><b>Cliente:</b> ${data.leadName}</li>
        <li><b>Telefono:</b> ${data.leadPhone}</li>
        <li><b>Tipo de caso:</b> ${data.caseType ?? "General"}</li>
        <li><b>Urgencia:</b> ${data.urgency ?? "Medium"}</li>
      </ul>
      <p><b>Resumen:</b><br/>${summary || "Sin resumen disponible."}</p>
      ${notes ? `<p><b>Notas adicionales:</b><br/>${notes}</p>` : ""}
      ${
        data.acceptUrl || data.rejectUrl
          ? `<div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
              ${
                data.acceptUrl
                  ? `<a href="${data.acceptUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 10px; background: #16a34a; color: #fff; text-decoration: none;">Aceptar</a>`
                  : ""
              }
              ${
                data.rejectUrl
                  ? `<a href="${data.rejectUrl}" style="display: inline-block; padding: 10px 16px; border-radius: 10px; background: #dc2626; color: #fff; text-decoration: none;">Rechazar</a>`
                  : ""
              }
            </div>`
          : ""
      }
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    to: data.to,
    subject,
    html,
  });

  console.log("[MAIL] smtp messageId:", info.messageId);

  return { ok: true, messageId: info.messageId };
}

export async function sendAttorneyDecisionEmail(data: AssignmentDecisionEmail) {
  const fromName = process.env.SMTP_FROM_NAME ?? "Tus Abogados 24/7";
  const fromEmail = mustEnv("SMTP_USER");
  const from = `${fromName} <${fromEmail}>`;
  const to = fromEmail;

  const decisionLabel = data.decision === "accept" ? "ACEPTADO" : "RECHAZADO";
  const subject = `Respuesta abogado: ${decisionLabel} - ${data.leadName ?? "Caso"}`;
  const notes = String(data.notes ?? "").trim();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4">
      <h2>Respuesta del abogado</h2>
      <p>Se registro una decision desde el correo del abogado.</p>
      <ul>
        <li><b>Decision:</b> ${decisionLabel}</li>
        <li><b>Abogado:</b> ${data.attorneyName ?? "N/A"}</li>
        <li><b>Correo abogado:</b> ${data.attorneyEmail ?? "N/A"}</li>
        <li><b>Lead:</b> ${data.leadName ?? "N/A"}</li>
        <li><b>Telefono:</b> ${data.leadPhone ?? "N/A"}</li>
        <li><b>Tipo de caso:</b> ${data.caseType ?? "N/A"}</li>
      </ul>
      ${notes ? `<p><b>Notas del abogado:</b><br/>${notes}</p>` : ""}
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  console.log("[MAIL] decision messageId:", info.messageId);

  return { ok: true, messageId: info.messageId };
}
