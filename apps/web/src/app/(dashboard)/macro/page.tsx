import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMacroProvider } from "@/lib/macro/providers";

export default async function MacroPage() {
  const provider = getMacroProvider();
  const indicators = await provider.getIndicators();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Macroeconomic Indicators</h1>
        <p className="text-sm text-muted-foreground">
          Sample indicators (mock provider). A real implementation would use FRED, World
          Bank, or IMF APIs.
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicator</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Previous</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.map((ind) => (
                <TableRow key={ind.id}>
                  <TableCell className="font-medium">{ind.name}</TableCell>
                  <TableCell className="text-muted-foreground">{ind.region}</TableCell>
                  <TableCell className="text-muted-foreground">{ind.period}</TableCell>
                  <TableCell>
                    {ind.value}
                    {ind.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ind.previousValue !== undefined ? `${ind.previousValue}${ind.unit}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
