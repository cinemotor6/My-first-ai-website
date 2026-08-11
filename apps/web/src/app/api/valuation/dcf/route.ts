import { dcfInputSchema } from "@/lib/valuation/schemas";
import { proxyToQuantApi } from "@/lib/valuation/proxy";

export async function POST(request: Request) {
  return proxyToQuantApi(request, "/api/v1/valuation/dcf", dcfInputSchema);
}
