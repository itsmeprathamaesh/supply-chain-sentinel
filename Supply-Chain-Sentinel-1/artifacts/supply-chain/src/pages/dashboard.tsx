import { 
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetRisks, getGetRisksQueryKey,
  useGetDemandTrends, getGetDemandTrendsQueryKey,
  useGetCurrencyRates, getGetCurrencyRatesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, TrendingUp, BellRing, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: risks, isLoading: isLoadingRisks } = useGetRisks({ query: { queryKey: getGetRisksQueryKey() } });
  const { data: trends, isLoading: isLoadingTrends } = useGetDemandTrends({ query: { queryKey: getGetDemandTrendsQueryKey() } });
  const { data: currency, isLoading: isLoadingCurrency } = useGetCurrencyRates({ query: { queryKey: getGetCurrencyRatesQueryKey() } });

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <>
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground">Real-time supply chain risk metrics and alerts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <div className={`text-2xl font-bold ${getRiskColor(summary?.avgRiskScore || 0)}`}>
                {summary?.avgRiskScore.toFixed(1)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delayed Deliveries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold text-amber-500">
                {summary?.delayedDeliveries}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forecasted Demand (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">
                {summary?.forecastedDemand30Days.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold text-red-500">
                {summary?.activeAlerts}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Demand Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingTrends ? (
              <div className="flex items-center justify-center h-full"><Skeleton className="h-full w-full" /></div>
            ) : trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="totalQuantity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Supplier Risk Scores</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingRisks ? (
              <div className="flex items-center justify-center h-full"><Skeleton className="h-full w-full" /></div>
            ) : risks && risks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={risks} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="supplierName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="riskScore" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Raw Material Currency Rates</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingCurrency ? (
               <Skeleton className="h-32 w-full" />
            ) : currency ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(currency.rates).map(([currencyCode, rate]) => (
                    <div key={currencyCode} className="flex justify-between items-center p-2 rounded-md border bg-secondary/20">
                      <span className="font-medium">{currencyCode}</span>
                      <span className="font-mono text-muted-foreground">{(rate as number).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
                {currency.alerts && currency.alerts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-amber-500 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Fluctuation Alerts
                    </h4>
                    {currency.alerts.map((alert, i) => (
                      <div key={i} className="text-sm bg-amber-500/10 text-amber-500 p-2 rounded-md border border-amber-500/20">
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No rate data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
