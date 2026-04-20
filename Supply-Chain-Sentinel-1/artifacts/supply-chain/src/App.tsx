import { Layout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Dashboard } from "@/pages/dashboard";
import { Suppliers } from "@/pages/suppliers";
import { Orders } from "@/pages/orders";
import { Deliveries } from "@/pages/deliveries";
import { Forecast } from "@/pages/forecast";
import { Alerts } from "@/pages/alerts";
import { UploadData } from "@/pages/upload";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/orders" component={Orders} />
        <Route path="/deliveries" component={Deliveries} />
        <Route path="/forecast" component={Forecast} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/upload" component={UploadData} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
