import { ScenarioForm } from "./scenario-form";

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
      <ScenarioForm />
    </div>
  );
}
