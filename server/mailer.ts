import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type AssignmentEmail = {
  to: string;
  attorneyName: string;
  leadName: string;
  leadPhone: string;
  caseType: string | null;
  urgency: string | null;
};

export async function sendAttorneyAssignmentEmail(data: AssignmentEmail) {
  const from = process.env.MAIL_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  console.log("[MAIL] sending...");
  console.log("[MAIL] RESEND_API_KEY loaded:", Boolean(apiKey));
  console.log("[MAIL] from:", from);
  console.log("[MAIL] to:", data.to);

  if (!apiKey) throw new Error("RESEND_API_KEY no está configurada");
  if (!from) throw new Error("MAIL_FROM no está configurado");

  const subject = `Nuevo caso asignado: ${data.caseType ?? "General"}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4">
      <h2>Nuevo caso asignado</h2>
      <p>Hola <b>${data.attorneyName}</b>,</p>
      <p>Se te asignó un nuevo caso.</p>
      <ul>
        <li><b>Cliente:</b> ${data.leadName}</li>
        <li><b>Teléfono:</b> ${data.leadPhone}</li>
        <li><b>Tipo de caso:</b> ${data.caseType ?? "General"}</li>
        <li><b>Urgencia:</b> ${data.urgency ?? "Medium"}</li>
      </ul>
      <p>Ingresa al CRM para ver detalles.</p>
    </div>
  `;

  const result = await resend.emails.send({
    from,
    to: data.to,
    subject,
    html,
  });

  console.log("[MAIL] resend result:", result);

  // Si Resend devuelve error en el payload:
  // @ts-ignore
  if (result?.error) {
    // @ts-ignore
    throw new Error(result.error?.message ?? "Resend error");
  }

  return result;
}
