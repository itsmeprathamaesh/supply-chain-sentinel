import { useListAlerts, getListAlertsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";

export function Alerts() {
  const { data: alerts, isLoading } = useListAlerts({ query: { queryKey: getListAlertsQueryKey() } });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-500 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "medium": return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      case "low": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "delay_risk": return <Clock className="h-5 w-5" />;
      case "supplier_risk": return <AlertTriangle className="h-5 w-5" />;
      case "demand_spike": return <TrendingUp className="h-5 w-5" />;
      case "low_stock": return <Package className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Alerts</h1>
        <p className="text-muted-foreground text-sm">Prioritized system warnings requiring attention.</p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card">
              <CardHeader className="py-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="pb-4">
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : alerts?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-md bg-card">
            No active alerts. System is nominal.
          </div>
        ) : (
          alerts?.map((alert) => (
            <Card key={alert.id} className="bg-card border-l-4" style={{ 
              borderLeftColor: alert.severity === 'critical' ? 'hsl(var(--destructive))' : 
                               alert.severity === 'high' ? '#f97316' : 
                               alert.severity === 'medium' ? '#f59e0b' : '#3b82f6'
            }}>
              <CardHeader className="py-4 flex flex-row items-start gap-4">
                <div className={`mt-1 ${
                   alert.severity === 'critical' ? 'text-red-500' : 
                   alert.severity === 'high' ? 'text-orange-500' : 
                   alert.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
                }`}>
                  {getIcon(alert.type)}
                </div>
                <div className="grid gap-1 flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>{format(new Date(alert.createdAt), 'MMM d, yyyy HH:mm')}</span>
                    {alert.supplierName && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-foreground">{alert.supplierName}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-4 ml-9">
                <p className="text-sm">{alert.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
