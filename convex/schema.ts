import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  clients: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  invoices: defineTable({
    userId: v.id("users"),
    clientId: v.id("clients"),
    invoiceNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      rate: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    currency: v.string(),
    dueDate: v.number(),
    sentAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  reminders: defineTable({
    invoiceId: v.id("invoices"),
    userId: v.id("users"),
    scheduledFor: v.number(),
    sent: v.boolean(),
    sentAt: v.optional(v.number()),
    type: v.union(v.literal("due_soon"), v.literal("overdue")),
  })
    .index("by_invoice", ["invoiceId"])
    .index("by_user", ["userId"])
    .index("by_scheduled", ["scheduledFor", "sent"]),
});
