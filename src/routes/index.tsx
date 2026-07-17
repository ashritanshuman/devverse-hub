import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Code2, Github, PenSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

type FeedArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  reading_time_minutes: number;
  published_at: string | null;
  author: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

function Home() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles", "feed"],
    queryFn: async (): Promise<FeedArticle[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, slug, title, excerpt, cover_image_url, tags, reading_time_minutes, published_at, author:profiles!articles_author_profile_fkey(username, display_name, avatar_url)",
        )
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as FeedArticle[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="h-3 w-3" /> AI-powered blogging for developers
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Where <span className="text-primary">developers</span> write,
            <br /> share, and learn.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Publish technical articles with markdown, code blocks, and diagrams. Grow your
            audience and connect with builders who care about their craft.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                <PenSquare className="mr-2 h-4 w-4" /> Start writing
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#feed">Explore articles</a>
            </Button>
          </div>
          <div className="mt-10 flex justify-center gap-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5" /> Markdown + code</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI ready</span>
            <span className="flex items-center gap-1.5"><Github className="h-3.5 w-3.5" /> Dev-focused</span>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section id="feed" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Latest articles</h2>
            <p className="text-sm text-muted-foreground">Fresh writing from the community.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No articles yet. Be the first to publish!</p>
              <Button asChild className="mt-4">
                <Link to="/auth">Start writing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        Built with ♥ on DevVerse
      </footer>
    </div>
  );
}

function ArticleCard({ a }: { a: FeedArticle }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: a.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card transition hover:border-primary/40 hover:shadow-md"
    >
      {a.cover_image_url ? (
        <img src={a.cover_image_url} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-secondary" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-1.5">
          {a.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
        <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">
          {a.title}
        </h3>
        {a.excerpt ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>@{a.author?.username ?? "author"}</span>
          <span>{a.reading_time_minutes} min read</span>
        </div>
      </div>
    </Link>
  );
}
