import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull().unique(),
  monthlyLimit: decimal("monthly_limit", { precision: 12, scale: 2 }).notNull(),
  currentSpent: decimal("current_spent", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insights = pgTable("insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'warning', 'success', 'info'
  title: text("title").notNull(),
  message: text("message").notNull(),
  category: text("category"),
  isRead: text("is_read").default("false").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.coerce.date(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  currentSpent: true,
  createdAt: true,
});

export const updateBudgetSchema = z.object({
  monthlyLimit: z.string(),
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
export type UpdateBudget = z.infer<typeof updateBudgetSchema>;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insights.$inferSelect;
