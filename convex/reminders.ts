import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("sent"), false))
      .collect();

    const withInvoices = await Promise.all(
      reminders.map(async (rem) => {
        const invoice = await ctx.db.get(rem.invoiceId);
        if (!invoice) return null;
        const client = await ctx.db.get(invoice.clientId);
        return { ...rem, invoice: { ...invoice, client } };
      })
    );

    return withInvoices.filter(Boolean);
  },
});

export const markSent = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reminder = await ctx.db.get(args.id);
    if (!reminder || reminder.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, {
      sent: true,
      sentAt: Date.now(),
    });
  },
});

export const getDueReminders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("sent"), false),
          q.lte(q.field("scheduledFor"), now)
        )
      )
      .collect();

    const withInvoices = await Promise.all(
      reminders.map(async (rem) => {
        const invoice = await ctx.db.get(rem.invoiceId);
        if (!invoice || invoice.status === "paid") return null;
        const client = await ctx.db.get(invoice.clientId);
        return { ...rem, invoice: { ...invoice, client } };
      })
    );

    return withInvoices.filter(Boolean);
  },
});
