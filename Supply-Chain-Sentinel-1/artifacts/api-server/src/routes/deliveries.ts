import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveriesTable, suppliersTable } from "@workspace/db";
import {
  CreateDeliveryBody,
  ListDeliveriesQueryParams,
} from "@workspace/api-zod";
import { calculateDeliveryRisk } from "../lib/riskCalculator";

const router: IRouter = Router();

router.get("/deliveries", async (req, res): Promise<void> => {
  const query = ListDeliveriesQueryParams.safeParse(req.query);
  const supplierId = query.success ? query.data.supplierId : undefined;
  const riskLevel = query.success ? query.data.riskLevel : undefined;

  let dbQuery = db
    .select({
      id: deliveriesTable.id,
      supplierId: deliveriesTable.supplierId,
      supplierName: suppliersTable.name,
      orderId: deliveriesTable.orderId,
      product: deliveriesTable.product,
      expectedDate: deliveriesTable.expectedDate,
      actualDate: deliveriesTable.actualDate,
      delayDays: deliveriesTable.delayDays,
      riskLevel: deliveriesTable.riskLevel,
      status: deliveriesTable.status,
      notes: deliveriesTable.notes,
    })
    .from(deliveriesTable)
    .leftJoin(suppliersTable, eq(deliveriesTable.supplierId, suppliersTable.id))
    .$dynamic();

  if (supplierId) {
    dbQuery = dbQuery.where(eq(deliveriesTable.supplierId, supplierId)) as typeof dbQuery;
  }

  let deliveries = await dbQuery;

  if (riskLevel) {
    deliveries = deliveries.filter((d) => d.riskLevel === riskLevel);
  }

  res.json(
    deliveries.map((d) => ({
      ...d,
      supplierName: d.supplierName ?? "Unknown",
    }))
  );
});

router.post("/deliveries", async (req, res): Promise<void> => {
  const parsed = CreateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { delayDays, riskLevel, status } = calculateDeliveryRisk(
    parsed.data.expectedDate,
    parsed.data.actualDate ?? null
  );

  const [delivery] = await db
    .insert(deliveriesTable)
    .values({
      ...parsed.data,
      delayDays,
      riskLevel,
      status,
    })
    .returning();

  const [supplier] = await db
    .select({ name: suppliersTable.name })
    .from(suppliersTable)
    .where(eq(suppliersTable.id, delivery.supplierId));

  res.status(201).json({
    ...delivery,
    supplierName: supplier?.name ?? "Unknown",
  });
});

export default router;
