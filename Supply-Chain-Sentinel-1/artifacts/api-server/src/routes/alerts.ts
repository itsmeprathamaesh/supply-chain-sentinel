import { Router, type IRouter } from "express";
import { db, alertsTable, deliveriesTable, suppliersTable, ordersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { calculateRiskScore } from "../lib/riskCalculator";

const router: IRouter = Router();

router.get("/alerts", async (_req, res): Promise<void> => {
  const alerts = await db
    .select()
    .from(alertsTable)
    .orderBy(desc(alertsTable.createdAt));

  res.json(
    alerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      supplierId: a.supplierId ?? null,
      supplierName: a.supplierName ?? null,
      createdAt: a.createdAt.toISOString(),
      isRead: a.isRead,
    }))
  );
});

router.get("/currency-rates", async (req, res): Promise<void> => {
  const OXR_APP_ID = process.env.OXR_APP_ID;

  const mockRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    CNY: 7.24,
    INR: 83.12,
    MYR: 4.71,
    SGD: 1.35,
    BDT: 109.75,
    LKR: 312.5,
    PKR: 278.4,
  };

  const currencyAlerts = [
    {
      currency: "INR",
      change: 0.8,
      message: "INR weakened by 0.8% against USD — raw material import costs may rise",
      severity: "medium" as const,
    },
    {
      currency: "CNY",
      change: -0.3,
      message: "CNY strengthened slightly — Chinese supplier costs relatively stable",
      severity: "low" as const,
    },
  ];

  if (OXR_APP_ID) {
    try {
      const response = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${OXR_APP_ID}&symbols=EUR,CNY,INR,MYR,SGD,BDT,LKR,PKR`
      );
      if (response.ok) {
        const data = (await response.json()) as { rates: Record<string, number>; timestamp: number };
        res.json({
          base: "USD",
          timestamp: data.timestamp,
          rates: { USD: 1, ...data.rates },
          alerts: currencyAlerts,
        });
        return;
      }
    } catch (_e) {
      req.log.warn("Could not fetch live currency rates, using mock data");
    }
  }

  res.json({
    base: "USD",
    timestamp: Math.floor(Date.now() / 1000),
    rates: mockRates,
    alerts: currencyAlerts,
  });
});

router.get("/dashboard-summary", async (_req, res): Promise<void> => {
  const [suppliers, deliveries, dbAlerts, allOrders] = await Promise.all([
    db.select().from(suppliersTable),
    db.select().from(deliveriesTable),
    db.select().from(alertsTable),
    db.select().from(ordersTable),
  ]);

  const riskScores = suppliers.map((s) => {
    const { score, level } = calculateRiskScore(
      s.onTimeDeliveryRate,
      s.defectRate,
      s.responseTime
    );
    return { score, level };
  });

  const avgRiskScore =
    riskScores.length > 0
      ? Math.round(riskScores.reduce((a, b) => a + b.score, 0) / riskScores.length)
      : 0;

  const highRiskSuppliers = riskScores.filter((r) => r.level === "high").length;
  const mediumRiskSuppliers = riskScores.filter((r) => r.level === "medium").length;
  const lowRiskSuppliers = riskScores.filter((r) => r.level === "low").length;

  const delayedDeliveries = deliveries.filter(
    (d) => d.status === "delayed" || d.status === "at_risk"
  ).length;
  const atRiskDeliveries = deliveries.filter((d) => d.status === "at_risk").length;

  const deliveredOnTime = deliveries.filter((d) => d.status === "delivered" && d.delayDays === 0).length;
  const totalDelivered = deliveries.filter((d) => d.status === "delivered").length;
  const onTimeDeliveryRate = totalDelivered > 0 ? Math.round((deliveredOnTime / totalDelivered) * 100) : 0;

  const totalOrderValue = allOrders.reduce((a, b) => a + b.totalValue, 0);

  const activeAlerts = dbAlerts.filter((a) => !a.isRead).length;
  const criticalAlerts = dbAlerts.filter((a) => a.severity === "critical" && !a.isRead).length;

  const monthMap: Record<string, number> = {};
  for (const o of allOrders) {
    const month = o.orderDate.substring(0, 7);
    if (!monthMap[month]) monthMap[month] = 0;
    monthMap[month] += o.quantity;
  }
  const months = Object.keys(monthMap).sort();
  let demandTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (months.length >= 2) {
    const recent = monthMap[months[months.length - 1]] ?? 0;
    const prev = monthMap[months[months.length - 2]] ?? 0;
    if (recent > prev * 1.05) demandTrend = "increasing";
    else if (recent < prev * 0.95) demandTrend = "decreasing";
  }

  const totalQuantity = allOrders.reduce((a, b) => a + b.quantity, 0);
  const forecastedDemand30Days = allOrders.length > 0 ? Math.round(totalQuantity / months.length) : 0;

  res.json({
    avgRiskScore,
    highRiskSuppliers,
    mediumRiskSuppliers,
    lowRiskSuppliers,
    totalSuppliers: suppliers.length,
    delayedDeliveries,
    atRiskDeliveries,
    totalDeliveries: deliveries.length,
    forecastedDemand30Days,
    demandTrend,
    activeAlerts,
    criticalAlerts,
    totalOrderValue: Math.round(totalOrderValue * 100) / 100,
    onTimeDeliveryRate,
  });
});

export default router;
