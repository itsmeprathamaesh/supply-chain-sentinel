import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, suppliersTable } from "@workspace/db";
import {
  CreateSupplierBody,
  GetSupplierParams,
} from "@workspace/api-zod";
import { calculateRiskScore } from "../lib/riskCalculator";

const router: IRouter = Router();

function mapSupplier(s: typeof suppliersTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    country: s.country,
    category: s.category,
    reliabilityScore: s.reliabilityScore,
    onTimeDeliveryRate: s.onTimeDeliveryRate,
    defectRate: s.defectRate,
    responseTime: s.responseTime,
    riskLevel: s.riskLevel,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/suppliers", async (_req, res): Promise<void> => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
  res.json(suppliers.map(mapSupplier));
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { score, level } = calculateRiskScore(
    parsed.data.onTimeDeliveryRate,
    parsed.data.defectRate,
    parsed.data.responseTime
  );

  const [supplier] = await db
    .insert(suppliersTable)
    .values({
      ...parsed.data,
      reliabilityScore: score,
      riskLevel: level,
    })
    .returning();

  res.status(201).json(mapSupplier(supplier));
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSupplierParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [supplier] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.id, params.data.id));

  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.json(mapSupplier(supplier));
});

router.get("/risks", async (_req, res): Promise<void> => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);

  const risks = suppliers.map((s) => {
    const { score, level, factors } = calculateRiskScore(
      s.onTimeDeliveryRate,
      s.defectRate,
      s.responseTime
    );
    return {
      supplierId: s.id,
      supplierName: s.name,
      riskScore: score,
      riskLevel: level,
      factors,
    };
  });

  res.json(risks);
});

export default router;
