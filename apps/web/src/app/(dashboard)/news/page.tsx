import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNewsProvider } from "@/lib/news/providers";

// Without this, Next prerenders the page once at build time and freezes
// the article list — force dynamic rendering on every request.
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const provider = getNewsProvider();
  const articles = await provider.getLatest(20);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">News</h1>
        <p className="text-sm text-muted-foreground">
          Live headlines where available, with sample fallback.
        </p>
      </div>
      <div className="space-y-3">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardHeader>
              <CardTitle className="text-foreground">
                {article.url === "#" ? (
                  article.headline
                ) : (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {article.headline}
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {article.source} · {new Date(article.publishedAt).toLocaleString()}
              {article.relatedSymbols.length > 0 && <> · {article.relatedSymbols.join(", ")}</>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
