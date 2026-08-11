import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DCF_FIELDS, type DCFFormState } from "@/lib/valuation/dcf-fields";

export function DCFFieldsGrid({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: DCFFormState;
  onChange: (key: keyof DCFFormState, value: string) => void;
}) {
  return (
    <>
      {DCF_FIELDS.map((field) => (
        <div key={field.key} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-2 sm:gap-2">
          <Label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</Label>
          <Input
            id={`${idPrefix}-${field.key}`}
            type={field.key === "symbol" ? "text" : "number"}
            step={field.step}
            value={value[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
            required
          />
        </div>
      ))}
    </>
  );
}
