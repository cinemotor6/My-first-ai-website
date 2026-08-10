import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MonteCarloPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Monte Carlo Valuation</h1>
        <p className="text-sm text-muted-foreground">
          Runs the DCF model thousands of times over randomized assumptions to produce a
          distribution of fair values.
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
          <code className="rounded bg-muted px-1 py-0.5">POST /api/v1/valuation/monte-carlo</code>{" "}
          in apps/quant-api) and returns <code className="rounded bg-muted px-1 py-0.5">501</code>{" "}
          until the simulation logic is implemented. This keeps the architecture and UI
          wiring in place without building the advanced model yet.
        </CardContent>
      </Card>
    </div>
  );
}
