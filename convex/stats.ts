import { query } from "./_generated/server";
import { v } from "convex/values";

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").collect();

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.status === "Qualified").length;
    const convertedLeads = leads.filter((l) => l.status === "Converted").length;

    // avg response time: if lastContactedAt exists, use (lastContactedAt - createdAt)
    const diffs = leads
      .map((l) => (l.lastContactedAt ? (l.lastContactedAt - (l.createdAt ?? 0)) : null))
      .filter((x): x is number => typeof x === "number" && x > 0);

    const avgMs = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
    const avgResponseTimeMinutes = Math.round(avgMs / 60000);

    return { totalLeads, qualifiedLeads, convertedLeads, avgResponseTimeMinutes };
  },
});
