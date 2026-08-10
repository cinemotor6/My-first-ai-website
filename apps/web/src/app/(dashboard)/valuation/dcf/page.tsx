import { DCFForm } from "./dcf-form";

export default function DCFPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">DCF Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Basic single-stage discounted cash flow model. Runs in the Python quant
          service (apps/quant-api), not in the browser.
        </p>
      </div>
      <DCFForm />
    </div>
  );
}
