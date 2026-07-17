import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/blog/$slug")({
  component: ArticleView,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Article not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been unpublished or moved.</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">
          Back home
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
});

function ArticleView() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, title, content, excerpt, cover_image_url, tags, reading_time_minutes, published_at, author:profiles!articles_author_profile_fkey(username, display_name, avatar_url, bio)",
        )
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as {
        id: string;
        title: string;
        content: string;
        excerpt: string | null;
        cover_image_url: string | null;
        tags: string[];
        reading_time_minutes: number;
        published_at: string | null;
        author: { username: string; display_name: string | null; avatar_url: string | null; bio: string | null } | null;
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded bg-muted" />
          </div>
        ) : error || !data ? (
          <p className="text-destructive">Failed to load article.</p>
        ) : (
          <>
            {data.cover_image_url ? (
              <img
                src={data.cover_image_url}
                alt=""
                className="mb-8 aspect-video w-full rounded-lg object-cover"
              />
            ) : null}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {data.tags?.map((t: string) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{data.title}</h1>
            <div className="mt-4 flex items-center gap-3 border-b border-border/60 pb-6 text-sm text-muted-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(data.author?.display_name || data.author?.username || "?")[0].toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {data.author?.display_name || data.author?.username}
                </div>
                <div className="text-xs">
                  {data.published_at
                    ? new Date(data.published_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                  {" · "}
                  {data.reading_time_minutes} min read
                </div>
              </div>
            </div>
            <div
              className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-pre:rounded-md prose-pre:bg-muted prose-code:text-primary prose-headings:tracking-tight"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(data.content || "") }}
            />
          </>
        )}
      </article>
    </div>
  );
}
