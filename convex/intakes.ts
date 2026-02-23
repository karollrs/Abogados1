import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ============================= */
/* CREATE INTAKE */
/* ============================= */

export const create = mutation({
  args: {
    leadId: v.number(),
    practiceArea: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // 🔒 Verificar que el lead exista
    const lead = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), args.leadId))
      .unique();

    if (!lead) {
      throw new Error("Lead does not exist");
    }

    const now = Date.now();

    const intakeId = await ctx.db.insert("intakes", {
      leadId: args.leadId,
      practiceArea: args.practiceArea,
      version: 1,
      data: args.data,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(intakeId);
  },
});

/* ============================= */
/* UPDATE INTAKE */
/* ============================= */

export const update = mutation({
  args: {
    intakeId: v.id("intakes"),
    data: v.any(),
  },
  handler: async (ctx, { intakeId, data }) => {
    const intake = await ctx.db.get(intakeId);

    if (!intake) {
      throw new Error("Intake not found");
    }

    await ctx.db.patch(intakeId, {
      data,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(intakeId);
  },
});

/* ============================= */
/* GET BY LEAD */
/* ============================= */

export const getByLeadId = query({
  args: { leadId: v.number() },
  handler: async (ctx, { leadId }) => {
    return await ctx.db
      .query("intakes")
      .withIndex("by_leadId", (q) => q.eq("leadId", leadId))
      .collect();
  },
});

/* ============================= */
/* GET BY LEAD + PRACTICE */
/* ============================= */

export const getByLeadAndPractice = query({
  args: {
    leadId: v.number(),
    practiceArea: v.string(),
  },
  handler: async (ctx, { leadId, practiceArea }) => {
    return await ctx.db
      .query("intakes")
      .withIndex("by_lead_practice", (q) =>
        q.eq("leadId", leadId).eq("practiceArea", practiceArea)
      )
      .unique();
  },
});