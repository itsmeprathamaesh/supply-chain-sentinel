import { Link, useLocation } from "wouter";
import { Activity, Users, ShoppingCart, Truck, LineChart, Bell, Upload, Menu, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/suppliers", label: "Suppliers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/deliveries", label: "Deliveries", icon: Truck },
  { href: "/forecast", label: "Forecast", icon: LineChart },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/upload", label: "Upload Data", icon: Upload },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 30000 } });

  const NavLinks = () => (
    <div className="flex flex-col gap-1 w-full mt-8">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  const HealthStatus = () => (
    <div className="mt-auto p-4 border-t flex items-center gap-2 text-xs">
      {!isError && health?.status === 'ok' ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-500 font-medium">System Nominal</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-500 font-medium">API Disconnected</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background dark">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-4 h-4 bg-primary rounded-sm" />
            RISK_COMMAND
          </div>
        </div>
        <NavLinks />
        <HealthStatus />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <div className="w-4 h-4 bg-primary rounded-sm" />
            RISK_COMMAND
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 dark bg-card flex flex-col">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2 font-bold tracking-tight">
                  <div className="w-4 h-4 bg-primary rounded-sm" />
                  RISK_COMMAND
                </div>
              </div>
              <NavLinks />
              <HealthStatus />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
