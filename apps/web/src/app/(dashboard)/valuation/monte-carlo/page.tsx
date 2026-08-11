import { MonteCarloForm } from "./monte-carlo-form";

export default function MonteCarloPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Monte Carlo Valuation</h1>
        <p className="text-sm text-muted-foreground">
          Runs the DCF model thousands of times over randomized revenue growth and
          discount rate assumptions to produce a distribution of fair values.
        </p>
      </div>
      <MonteCarloForm />
    </div>
  );
}
