import { query } from "./_generated/server";
import { v } from "convex/values";

export async function nextId(ctx: any, name: string): Promise<number> {
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_name", (q: any) => q.eq("name", name))
    .unique();

  if (!existing) {
    await ctx.db.insert("counters", { name, value: 1 });
    return 1;
  }

  const next = existing.value + 1;
  await ctx.db.patch(existing._id, { value: next });
  return next;
}

export const now = query({
  args: {},
  handler: async () => Date.now(),
});
