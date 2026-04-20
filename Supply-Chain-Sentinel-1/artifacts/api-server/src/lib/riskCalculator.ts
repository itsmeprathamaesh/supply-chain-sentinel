export function calculateRiskScore(
  onTimeDeliveryRate: number,
  defectRate: number,
  responseTime: number
): { score: number; level: "low" | "medium" | "high"; factors: string[] } {
  const factors: string[] = [];

  const deliveryScore = Math.min(onTimeDeliveryRate, 100);
  const defectScore = Math.max(0, 100 - defectRate * 10);
  const responseScore = Math.max(0, 100 - (responseTime / 72) * 40);

  const reliability = deliveryScore * 0.5 + defectScore * 0.3 + responseScore * 0.2;

  if (onTimeDeliveryRate < 70) factors.push("Low on-time delivery rate");
  if (onTimeDeliveryRate < 85) factors.push("Below-average delivery performance");
  if (defectRate > 5) factors.push("High defect rate");
  if (defectRate > 2) factors.push("Elevated defect rate");
  if (responseTime > 48) factors.push("Slow response time");
  if (responseTime > 24) factors.push("Above-average response time");

  let level: "low" | "medium" | "high";
  if (reliability >= 75) level = "low";
  else if (reliability >= 50) level = "medium";
  else level = "high";

  return { score: Math.round(reliability), level, factors };
}

export function calculateDeliveryRisk(
  expectedDate: string,
  actualDate: string | null | undefined
): { delayDays: number; riskLevel: "low" | "medium" | "high"; status: "on_time" | "delayed" | "at_risk" | "delivered" } {
  const today = new Date();
  const expected = new Date(expectedDate);

  if (actualDate) {
    const actual = new Date(actualDate);
    const delayDays = Math.max(0, Math.round((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24)));
    let riskLevel: "low" | "medium" | "high" = delayDays === 0 ? "low" : delayDays <= 3 ? "medium" : "high";
    return { delayDays, riskLevel, status: "delivered" };
  }

  const daysUntilExpected = Math.round((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpected > 3) {
    return { delayDays: 0, riskLevel: "low", status: "on_time" };
  } else if (daysUntilExpected >= 0) {
    return { delayDays: 0, riskLevel: "medium", status: "at_risk" };
  } else {
    const delayDays = Math.abs(daysUntilExpected);
    const riskLevel = delayDays > 7 ? "high" : "medium";
    return { delayDays, riskLevel, status: "delayed" };
  }
}

export function generateForecast(historicalData: { month: string; totalQuantity: number }[]) {
  if (historicalData.length === 0) {
    const today = new Date();
    const predictions = [];
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      predictions.push({
        date: date.toISOString().split("T")[0],
        predictedQuantity: 100,
        lowerBound: 80,
        upperBound: 120,
      });
    }
    return {
      predictions,
      totalPredictedDemand: 3000,
      avgDailyDemand: 100,
      trend: "stable" as const,
      confidence: 0.6,
    };
  }

  const sorted = [...historicalData].sort((a, b) => a.month.localeCompare(b.month));
  const quantities = sorted.map((d) => d.totalQuantity);
  const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;

  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (quantities.length >= 2) {
    const recentAvg = quantities.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, quantities.length);
    const earlyAvg = quantities.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, quantities.length);
    if (recentAvg > earlyAvg * 1.1) trend = "increasing";
    else if (recentAvg < earlyAvg * 0.9) trend = "decreasing";
  }

  const dailyAvg = avg / 30;
  const trendFactor = trend === "increasing" ? 1.02 : trend === "decreasing" ? 0.98 : 1;

  const today = new Date();
  const predictions = [];
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const base = Math.round(dailyAvg * Math.pow(trendFactor, i));
    const variance = Math.round(base * 0.15);
    predictions.push({
      date: date.toISOString().split("T")[0],
      predictedQuantity: base,
      lowerBound: Math.max(0, base - variance),
      upperBound: base + variance,
    });
  }

  const totalPredictedDemand = predictions.reduce((a, b) => a + b.predictedQuantity, 0);

  return {
    predictions,
    totalPredictedDemand,
    avgDailyDemand: Math.round((totalPredictedDemand / 30) * 10) / 10,
    trend,
    confidence: Math.min(0.95, 0.65 + quantities.length * 0.02),
  };
}
