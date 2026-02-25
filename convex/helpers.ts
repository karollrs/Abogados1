import { query } from "./_generated/server";
import { v } from "convex/values";

export async function nextId(ctx: any, name: string): Promise<number> {
  const rows = await ctx.db
    .query("counters")
    .withIndex("by_name", (q: any) => q.eq("name", name))
    .collect();

  if (!rows.length) {
    await ctx.db.insert("counters", { name, value: 1 });
    return 1;
  }

  // If legacy duplicates exist, keep incrementing the highest value.
  const canonical = rows.reduce((best: any, row: any) =>
    Number(row?.value ?? 0) > Number(best?.value ?? 0) ? row : best
  );
  const next = Number(canonical?.value ?? 0) + 1;
  await ctx.db.patch(canonical._id, { value: next });
  return next;
}

export const now = query({
  args: {},
  handler: async () => Date.now(),
});
