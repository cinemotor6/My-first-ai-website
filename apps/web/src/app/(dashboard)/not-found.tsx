import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-foreground">Not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t find what you were looking for — it may not exist in the
            sample data set.
          </p>
          <Button asChild>
            <Link href="/">Back to overview</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
