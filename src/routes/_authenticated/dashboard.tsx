import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PenSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["my-articles"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, excerpt, published, published_at, updated_at, tags")
        .eq("author_id", user.user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your articles</h1>
            <p className="text-sm text-muted-foreground">Drafts and published pieces.</p>
          </div>
          <Button asChild>
            <Link to="/write/$id" params={{ id: "new" }}>
              <PenSquare className="mr-2 h-4 w-4" /> New article
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="mb-4 text-muted-foreground">No articles yet.</p>
              <Button asChild>
                <Link to="/write/$id" params={{ id: "new" }}>Write your first article</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                to="/write/$id"
                params={{ id: a.id }}
                className="block rounded-lg border border-border/60 bg-card p-5 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h2 className="truncate font-medium">{a.title || "Untitled"}</h2>
                      <Badge variant={a.published ? "default" : "secondary"}>
                        {a.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {a.excerpt ? (
                      <p className="line-clamp-1 text-sm text-muted-foreground">{a.excerpt}</p>
                    ) : null}
                  </div>
                  <div className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(a.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
