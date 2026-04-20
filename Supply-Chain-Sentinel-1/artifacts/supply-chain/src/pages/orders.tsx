import { useState } from "react";
import { useListOrders, getListOrdersQueryKey, useGetDemandTrends, getGetDemandTrendsQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function Orders() {
  const { data: orders, isLoading: isLoadingOrders } = useListOrders({}, { query: { queryKey: getListOrdersQueryKey({}) } });
  const { data: trends, isLoading: isLoadingTrends } = useGetDemandTrends({ query: { queryKey: getGetDemandTrendsQueryKey() } });
  
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "delayed": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createOrder.mutate({
      data: {
        supplierId: Number(formData.get("supplierId")),
        product: formData.get("product") as string,
        quantity: Number(formData.get("quantity")),
        unitPrice: Number(formData.get("unitPrice")),
        orderDate: formData.get("orderDate") as string,
        expectedDelivery: formData.get("expectedDelivery") as string,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
        toast({ title: "Order created successfully" });
      },
      onError: () => toast({ title: "Failed to create order", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders & Demand</h1>
          <p className="text-muted-foreground text-sm">Historical order log and aggregate demand trends.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Order</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier ID</label>
                  <Input name="supplierId" type="number" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input name="product" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input name="quantity" type="number" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Price</label>
                  <Input name="unitPrice" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Date</label>
                  <Input name="orderDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Delivery</label>
                  <Input name="expectedDelivery" type="date" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createOrder.isPending}>
                {createOrder.isPending ? "Creating..." : "Create Order"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Historical Demand Trend</CardTitle>
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
                <Line type="monotone" dataKey="totalQuantity" name="Demand Quantity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingOrders ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-muted-foreground">#{order.id}</TableCell>
                  <TableCell className="font-medium">{order.supplierName}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell className="text-right">{order.quantity}</TableCell>
                  <TableCell className="text-right font-mono">${order.totalValue.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(order.orderDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
