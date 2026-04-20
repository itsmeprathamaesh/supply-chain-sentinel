import { useState } from "react";
import { useUploadCsv } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { UploadCsvBodyType } from "@workspace/api-client-react/src/generated/api.schemas";

export function UploadData() {
  const [type, setType] = useState<UploadCsvBodyType>("orders");
  const [csvData, setCsvData] = useState("");
  const uploadMutation = useUploadCsv();
  const { toast } = useToast();

  const handleUpload = () => {
    if (!csvData.trim()) {
      toast({ title: "Error", description: "CSV data cannot be empty.", variant: "destructive" });
      return;
    }
    
    uploadMutation.mutate({ data: { type, csvData } }, {
      onSuccess: (res) => {
        if (res.success) {
          toast({ title: "Success", description: res.message });
          setCsvData("");
        } else {
          toast({ title: "Upload Failed", description: res.message, variant: "destructive" });
        }
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to upload data.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Ingestion</h1>
        <p className="text-muted-foreground text-sm">Upload raw CSV data to update system predictions.</p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Batch Upload</CardTitle>
          <CardDescription>Paste comma-separated values matching the selected entity type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Entity Type</label>
            <Select value={type} onValueChange={(v) => setType(v as UploadCsvBodyType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="suppliers">Suppliers</SelectItem>
                <SelectItem value="deliveries">Deliveries</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CSV Data</label>
            <Textarea 
              placeholder="id,name,category..." 
              className="font-mono text-xs min-h-[300px] resize-y"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="w-full sm:w-auto">
            {uploadMutation.isPending ? "Uploading..." : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Process Data
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
