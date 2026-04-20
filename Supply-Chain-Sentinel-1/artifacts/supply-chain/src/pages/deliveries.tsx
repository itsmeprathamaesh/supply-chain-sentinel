import { useState } from "react";
import { useListDeliveries, getListDeliveriesQueryKey, useCreateDelivery } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/risk-badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function Deliveries() {
  const { data: deliveries, isLoading } = useListDeliveries({}, { query: { queryKey: getListDeliveriesQueryKey({}) } });
  
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createDelivery = useCreateDelivery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "on_time": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "delayed": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "at_risk": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createDelivery.mutate({
      data: {
        supplierId: Number(formData.get("supplierId")),
        orderId: formData.get("orderId") ? Number(formData.get("orderId")) : undefined,
        product: formData.get("product") as string,
        expectedDate: formData.get("expectedDate") as string,
        actualDate: formData.get("actualDate") as string || undefined,
        notes: formData.get("notes") as string,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey({}) });
        toast({ title: "Delivery logged successfully" });
      },
      onError: () => toast({ title: "Failed to log delivery", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-muted-foreground text-sm">Track incoming deliveries and delay risks.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Log Delivery</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Delivery</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier ID</label>
                  <Input name="supplierId" type="number" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order ID (optional)</label>
                  <Input name="orderId" type="number" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input name="product" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Date</label>
                  <Input name="expectedDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Actual Date (if delivered)</label>
                  <Input name="actualDate" type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input name="notes" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createDelivery.isPending}>
                {createDelivery.isPending ? "Saving..." : "Save Delivery"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead className="text-right">Delay (Days)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                </TableRow>
              ))
            ) : deliveries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No deliveries found.
                </TableCell>
              </TableRow>
            ) : (
              deliveries?.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono text-muted-foreground">#{delivery.id}</TableCell>
                  <TableCell className="font-medium">{delivery.supplierName}</TableCell>
                  <TableCell>{delivery.product}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(delivery.expectedDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-muted-foreground">{delivery.actualDate ? format(new Date(delivery.actualDate), 'MMM d, yyyy') : '-'}</TableCell>
                  <TableCell className="text-right">
                    <span className={delivery.delayDays > 0 ? "text-red-500 font-medium" : ""}>
                      {delivery.delayDays}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(delivery.status)}>
                      {delivery.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell><RiskBadge level={delivery.riskLevel} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
