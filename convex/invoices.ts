import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let invoices = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (args.status && args.status !== "all") {
      invoices = invoices.filter((inv) => inv.status === args.status);
    }

    // Attach client info
    const withClients = await Promise.all(
      invoices.map(async (inv) => {
        const client = await ctx.db.get(inv.clientId);
        return { ...inv, client };
      })
    );

    return withClients;
  },
});

export const get = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const invoice = await ctx.db.get(args.id);
    if (!invoice || invoice.userId !== userId) return null;
    const client = await ctx.db.get(invoice.clientId);
    return { ...invoice, client };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { total: 0, paid: 0, pending: 0, overdue: 0, draft: 0 };

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const stats = {
      total: invoices.length,
      paid: 0,
      pending: 0,
      overdue: 0,
      draft: 0,
      totalRevenue: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    };

    invoices.forEach((inv) => {
      if (inv.status === "paid") {
        stats.paid++;
        stats.totalRevenue += inv.total;
      } else if (inv.status === "sent") {
        stats.pending++;
        stats.pendingAmount += inv.total;
      } else if (inv.status === "overdue") {
        stats.overdue++;
        stats.overdueAmount += inv.total;
      } else {
        stats.draft++;
      }
    });

    return stats;
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      rate: v.number(),
    })),
    tax: v.number(),
    currency: v.string(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate invoice number
    const existingInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const invoiceNumber = `INV-${String(existingInvoices.length + 1).padStart(4, "0")}`;

    const subtotal = args.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (args.tax / 100);
    const total = subtotal + taxAmount;

    return await ctx.db.insert("invoices", {
      userId,
      clientId: args.clientId,
      invoiceNumber,
      status: "draft",
      items: args.items,
      subtotal,
      tax: args.tax,
      total,
      currency: args.currency,
      dueDate: args.dueDate,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    clientId: v.id("clients"),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      rate: v.number(),
    })),
    tax: v.number(),
    currency: v.string(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.id);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    const subtotal = args.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxAmount = subtotal * (args.tax / 100);
    const total = subtotal + taxAmount;

    await ctx.db.patch(args.id, {
      clientId: args.clientId,
      items: args.items,
      subtotal,
      tax: args.tax,
      total,
      currency: args.currency,
      dueDate: args.dueDate,
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

export const send = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.id);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create reminder for 3 days before due date
    const reminderDate = invoice.dueDate - 3 * 24 * 60 * 60 * 1000;
    if (reminderDate > Date.now()) {
      await ctx.db.insert("reminders", {
        invoiceId: args.id,
        userId,
        scheduledFor: reminderDate,
        sent: false,
        type: "due_soon",
      });
    }

    // Create overdue reminder
    await ctx.db.insert("reminders", {
      invoiceId: args.id,
      userId,
      scheduledFor: invoice.dueDate + 24 * 60 * 60 * 1000,
      sent: false,
      type: "overdue",
    });
  },
});

export const markPaid = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.id);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const markOverdue = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.id);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, {
      status: "overdue",
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const invoice = await ctx.db.get(args.id);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    // Delete related reminders
    const reminders = await ctx.db
      .query("reminders")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", args.id))
      .collect();
    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }

    await ctx.db.delete(args.id);
  },
});
