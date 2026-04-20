import { pgTable, text, serial, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  category: text("category").notNull(),
  reliabilityScore: real("reliability_score").notNull().default(50),
  onTimeDeliveryRate: real("on_time_delivery_rate").notNull().default(80),
  defectRate: real("defect_rate").notNull().default(2),
  responseTime: real("response_time").notNull().default(24),
  riskLevel: riskLevelEnum("risk_level").notNull().default("medium"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliersTable).omit({
  id: true,
  createdAt: true,
  reliabilityScore: true,
  riskLevel: true,
});
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliersTable.$inferSelect;
