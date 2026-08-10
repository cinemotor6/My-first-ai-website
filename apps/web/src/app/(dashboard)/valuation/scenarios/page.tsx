import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ScenariosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Scenario Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Compares fair value under named scenarios (bull / base / bear, or custom
          assumption overrides) side by side.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Coming in a later phase <Badge variant="outline">not implemented</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The API contract already exists (
          <code className="rounded bg-muted px-1 py-0.5">POST /api/v1/valuation/scenarios</code>{" "}
          in apps/quant-api) and returns <code className="rounded bg-muted px-1 py-0.5">501</code>{" "}
          until it&apos;s implemented.
        </CardContent>
      </Card>
    </div>
  );
}
