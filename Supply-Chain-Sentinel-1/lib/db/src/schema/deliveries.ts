import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliveryRiskLevelEnum = pgEnum("delivery_risk_level", ["low", "medium", "high"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["on_time", "delayed", "at_risk", "delivered"]);

export const deliveriesTable = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  orderId: integer("order_id"),
  product: text("product").notNull(),
  expectedDate: text("expected_date").notNull(),
  actualDate: text("actual_date"),
  delayDays: integer("delay_days").notNull().default(0),
  riskLevel: deliveryRiskLevelEnum("risk_level").notNull().default("low"),
  status: deliveryStatusEnum("status").notNull().default("on_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({
  id: true,
  createdAt: true,
  delayDays: true,
  riskLevel: true,
  status: true,
});
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;
