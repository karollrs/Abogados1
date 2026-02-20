import { query } from "./_generated/server";

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").collect();

    const totalLeads = leads.length;

    // Ajustado a tus nuevos status reales
    const qualifiedLeads = leads.filter(
      (l) => l.status === "en_espera_aceptacion"
    ).length;

    const convertedLeads = leads.filter(
      (l) => l.status === "asignada"
    ).length;

    // Promedio de respuesta si existe lastContactedAt
    const diffs = leads
      .map((l) =>
        l.lastContactedAt && l.createdAt
          ? l.lastContactedAt - l.createdAt
          : null
      )
      .filter((x): x is number => typeof x === "number" && x > 0);

    const avgMs = diffs.length
      ? diffs.reduce((a, b) => a + b, 0) / diffs.length
      : 0;

    const avgResponseTimeMinutes = Math.round(avgMs / 60000);

    return {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      avgResponseTimeMinutes,
    };
  },
});
