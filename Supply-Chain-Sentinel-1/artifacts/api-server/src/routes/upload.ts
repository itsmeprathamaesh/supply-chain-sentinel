import { Router, type IRouter } from "express";
import { db, suppliersTable, ordersTable, deliveriesTable } from "@workspace/db";
import { UploadCsvBody } from "@workspace/api-zod";
import { calculateRiskScore, calculateDeliveryRisk } from "../lib/riskCalculator";

const router: IRouter = Router();

function parseCsvToObjects(csvData: string): Record<string, string>[] {
  const lines = csvData.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      rows.push(row);
    }
  }

  return rows;
}

router.post("/upload", async (req, res): Promise<void> => {
  const parsed = UploadCsvBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, csvData } = parsed.data;
  const rows = parseCsvToObjects(csvData);

  if (rows.length === 0) {
    res.status(400).json({ error: "No valid rows found in CSV" });
    return;
  }

  let rowsImported = 0;

  if (type === "suppliers") {
    for (const row of rows) {
      const onTimeRate = parseFloat(row.on_time_delivery_rate || row.onTimeDeliveryRate || "80");
      const defectRate = parseFloat(row.defect_rate || row.defectRate || "2");
      const responseTime = parseFloat(row.response_time || row.responseTime || "24");

      const { score, level } = calculateRiskScore(onTimeRate, defectRate, responseTime);

      await db.insert(suppliersTable).values({
        name: row.name || "Unknown Supplier",
        country: row.country || "Unknown",
        category: row.category || "General",
        onTimeDeliveryRate: onTimeRate,
        defectRate,
        responseTime,
        reliabilityScore: score,
        riskLevel: level,
      }).onConflictDoNothing();
      rowsImported++;
    }
  } else if (type === "orders") {
    for (const row of rows) {
      const quantity = parseInt(row.quantity || "0", 10);
      const unitPrice = parseFloat(row.unit_price || row.unitPrice || "0");
      const supplierId = parseInt(row.supplier_id || row.supplierId || "1", 10);

      await db.insert(ordersTable).values({
        supplierId,
        product: row.product || "Unknown Product",
        quantity,
        unitPrice,
        totalValue: quantity * unitPrice,
        orderDate: row.order_date || row.orderDate || new Date().toISOString().split("T")[0],
        expectedDelivery: row.expected_delivery || row.expectedDelivery || new Date().toISOString().split("T")[0],
        status: (row.status as "pending" | "delivered" | "delayed" | "cancelled") || "pending",
      });
      rowsImported++;
    }
  } else if (type === "deliveries") {
    for (const row of rows) {
      const supplierId = parseInt(row.supplier_id || row.supplierId || "1", 10);
      const expectedDate = row.expected_date || row.expectedDate || new Date().toISOString().split("T")[0];
      const actualDate = row.actual_date || row.actualDate || null;

      const { delayDays, riskLevel, status } = calculateDeliveryRisk(expectedDate, actualDate);

      await db.insert(deliveriesTable).values({
        supplierId,
        product: row.product || "Unknown Product",
        expectedDate,
        actualDate: actualDate || undefined,
        delayDays,
        riskLevel,
        status,
        notes: row.notes || undefined,
      });
      rowsImported++;
    }
  }

  res.json({
    success: true,
    rowsImported,
    message: `Successfully imported ${rowsImported} ${type} records`,
  });
});

export default router;
