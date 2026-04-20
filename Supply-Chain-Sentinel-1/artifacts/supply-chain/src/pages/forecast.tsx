import { useGetForecast, getGetForecastQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts";
import { format } from "date-fns";

export function Forecast() {
  const { data: forecast, isLoading } = useGetForecast({ query: { queryKey: getGetForecastQueryKey() } });

  const chartData = forecast?.predictions.map(p => ({
    date: format(new Date(p.date), 'MMM dd'),
    predicted: p.predictedQuantity,
    bounds: [p.lowerBound, p.upperBound]
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demand Forecast</h1>
        <p className="text-muted-foreground text-sm">30-day predicted demand bounds based on historical data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Predicted Demand</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">
                {forecast?.totalPredictedDemand.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">
                {forecast?.avgDailyDemand.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold capitalize">
                {forecast?.trend}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>30-Day Projection Bounds</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading ? (
             <div className="flex items-center justify-center h-full"><Skeleton className="h-full w-full" /></div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  formatter={(value: any, name: string) => [Array.isArray(value) ? `${value[0]} - ${value[1]}` : value, name === 'bounds' ? '95% Confidence Interval' : 'Predicted Demand']}
                />
                <Area type="monotone" dataKey="bounds" fill="hsl(var(--primary)/0.2)" stroke="none" />
                <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No forecast data available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
