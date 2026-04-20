import { useState } from "react";
import { useListSuppliers, getListSuppliersQueryKey, useCreateSupplier, useGetSupplier, getGetSupplierQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge } from "@/components/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

export function Suppliers() {
  const { data: suppliers, isLoading } = useListSuppliers({ query: { queryKey: getListSuppliersQueryKey() } });
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSupplier = useCreateSupplier();

  const { data: supplierDetails, isLoading: isSupplierLoading } = useGetSupplier(selectedSupplierId!, { 
    query: { enabled: !!selectedSupplierId, queryKey: getGetSupplierQueryKey(selectedSupplierId!) } 
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSupplier.mutate({
      data: {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        country: formData.get("country") as string,
        onTimeDeliveryRate: Number(formData.get("onTimeDeliveryRate")),
        defectRate: Number(formData.get("defectRate")),
        responseTime: Number(formData.get("responseTime")),
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        toast({ title: "Supplier created successfully" });
      },
      onError: () => toast({ title: "Failed to create supplier", variant: "destructive" })
    });
  };

  const filteredSuppliers = suppliers?.filter(s => filterRisk === "all" || s.riskLevel === filterRisk) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground text-sm">Monitor supplier reliability and risk levels.</p>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2">
          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Supplier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input name="name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Input name="category" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <Input name="country" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">On-Time Rate (%)</label>
                    <Input name="onTimeDeliveryRate" type="number" step="0.1" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Defect Rate (%)</label>
                    <Input name="defectRate" type="number" step="0.1" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Response Time (hrs)</label>
                    <Input name="responseTime" type="number" step="0.1" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createSupplier.isPending}>
                  {createSupplier.isPending ? "Creating..." : "Save Supplier"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Reliability</TableHead>
              <TableHead>Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No suppliers found matching the filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSupplierId(supplier.id)}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.category}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.country}</TableCell>
                  <TableCell className="text-right font-mono">{supplier.reliabilityScore}/100</TableCell>
                  <TableCell><RiskBadge level={supplier.riskLevel} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Drawer open={!!selectedSupplierId} onOpenChange={(o) => !o && setSelectedSupplierId(null)}>
        <DrawerContent className="h-[80vh] sm:h-[60vh] max-w-2xl mx-auto flex flex-col p-6 dark bg-card">
          <DrawerHeader className="px-0 pt-0 text-left">
            <DrawerTitle className="text-2xl">{supplierDetails?.name || <Skeleton className="h-8 w-48" />}</DrawerTitle>
            <DrawerDescription>Supplier Details</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {isSupplierLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : supplierDetails ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1 border rounded-md p-4 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Category</span>
                  <div className="font-medium text-lg">{supplierDetails.category}</div>
                </div>
                <div className="space-y-1 border rounded-md p-4 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Country</span>
                  <div className="font-medium text-lg">{supplierDetails.country}</div>
                </div>
                <div className="space-y-1 border rounded-md p-4 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Reliability Score</span>
                  <div className="font-mono text-xl">{supplierDetails.reliabilityScore}/100</div>
                </div>
                <div className="space-y-1 border rounded-md p-4 bg-muted/20 flex flex-col justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Risk Level</span>
                  <div><RiskBadge level={supplierDetails.riskLevel} /></div>
                </div>
                <div className="space-y-1 border rounded-md p-4 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">On-Time Delivery</span>
                  <div className="font-mono text-xl">{supplierDetails.onTimeDeliveryRate}%</div>
                </div>
                <div className="space-y-1 border rounded-md p-4 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Defect Rate</span>
                  <div className="font-mono text-xl">{supplierDetails.defectRate}%</div>
                </div>
                <div className="space-y-1 border rounded-md p-4 bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Avg Response Time</span>
                  <div className="font-mono text-xl">{supplierDetails.responseTime} hrs</div>
                </div>
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
