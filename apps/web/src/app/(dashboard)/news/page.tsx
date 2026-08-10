import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNewsProvider } from "@/lib/news/providers";

export default async function NewsPage() {
  const provider = getNewsProvider();
  const articles = await provider.getLatest(20);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">News</h1>
        <p className="text-sm text-muted-foreground">Sample headlines (mock provider).</p>
      </div>
      <div className="space-y-3">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <CardTitle className="text-foreground">{article.headline}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {article.source} · {new Date(article.publishedAt).toLocaleString()} ·{" "}
              {article.relatedSymbols.join(", ")}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
