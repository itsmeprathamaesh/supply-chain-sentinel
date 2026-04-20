import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, suppliersTable } from "@workspace/db";
import {
  CreateOrderBody,
  ListOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  const supplierId = query.success ? query.data.supplierId : undefined;
  const limit = query.success ? query.data.limit : undefined;

  let dbQuery = db
    .select({
      id: ordersTable.id,
      supplierId: ordersTable.supplierId,
      supplierName: suppliersTable.name,
      product: ordersTable.product,
      quantity: ordersTable.quantity,
      unitPrice: ordersTable.unitPrice,
      totalValue: ordersTable.totalValue,
      orderDate: ordersTable.orderDate,
      expectedDelivery: ordersTable.expectedDelivery,
      status: ordersTable.status,
    })
    .from(ordersTable)
    .leftJoin(suppliersTable, eq(ordersTable.supplierId, suppliersTable.id))
    .orderBy(desc(ordersTable.orderDate))
    .$dynamic();

  if (supplierId) {
    dbQuery = dbQuery.where(eq(ordersTable.supplierId, supplierId)) as typeof dbQuery;
  }

  let orders = await dbQuery;
  if (limit) orders = orders.slice(0, limit);

  res.json(
    orders.map((o) => ({
      ...o,
      supplierName: o.supplierName ?? "Unknown",
    }))
  );
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const totalValue = parsed.data.quantity * parsed.data.unitPrice;

  const [order] = await db
    .insert(ordersTable)
    .values({ ...parsed.data, totalValue })
    .returning();

  const [supplier] = await db
    .select({ name: suppliersTable.name })
    .from(suppliersTable)
    .where(eq(suppliersTable.id, order.supplierId));

  res.status(201).json({
    ...order,
    supplierName: supplier?.name ?? "Unknown",
  });
});

router.get("/demand-trends", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable);

  const monthMap: Record<string, { totalQuantity: number; totalValue: number; orderCount: number }> = {};

  for (const order of orders) {
    const month = order.orderDate.substring(0, 7);
    if (!monthMap[month]) {
      monthMap[month] = { totalQuantity: 0, totalValue: 0, orderCount: 0 };
    }
    monthMap[month].totalQuantity += order.quantity;
    monthMap[month].totalValue += order.totalValue;
    monthMap[month].orderCount += 1;
  }

  const trends = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  res.json(trends);
});

export default router;
