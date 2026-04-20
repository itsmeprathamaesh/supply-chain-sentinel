import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { generateForecast } from "../lib/riskCalculator";

const router: IRouter = Router();

router.get("/forecast", async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable);

  const monthMap: Record<string, { totalQuantity: number }> = {};
  for (const order of orders) {
    const month = order.orderDate.substring(0, 7);
    if (!monthMap[month]) monthMap[month] = { totalQuantity: 0 };
    monthMap[month].totalQuantity += order.quantity;
  }

  const historicalData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, totalQuantity: data.totalQuantity }));

  const forecast = generateForecast(historicalData);
  res.json(forecast);
});

export default router;
