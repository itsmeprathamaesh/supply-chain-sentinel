import { Badge } from "@/components/ui/badge";

export function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  if (level === "high") {
    return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">High</Badge>;
  }
  if (level === "medium") {
    return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Medium</Badge>;
  }
  return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Low</Badge>;
}
