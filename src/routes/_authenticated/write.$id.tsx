import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { renderMarkdown, estimateReadingTime, slugify } from "@/lib/markdown";
import { Trash2, Save, Send, Undo2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/write/$id")({
  component: Editor,
});

type Draft = {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  tags: string;
  published: boolean;
};

const empty: Draft = {
  title: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  tags: "",
  published: false,
};

function Editor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [draft, setDraft] = useState<Draft>(empty);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Article not found");
        navigate({ to: "/dashboard" });
        return;
      }
      setDraft({
        id: data.id,
        title: data.title ?? "",
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        cover_image_url: data.cover_image_url ?? "",
        tags: (data.tags ?? []).join(", "),
        published: data.published,
      });
      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function save(publish?: boolean) {
    if (!draft.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) {
      setSaving(false);
      return toast.error("Not signed in");
    }

    const tagsArr = draft.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const nowPublish = publish ?? draft.published;

    const payload = {
      author_id: user.id,
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim() || null,
      content: draft.content,
      cover_image_url: draft.cover_image_url.trim() || null,
      tags: tagsArr,
      reading_time_minutes: estimateReadingTime(draft.content),
      published: nowPublish,
      published_at: nowPublish ? new Date().toISOString() : null,
    };

    if (isNew || !draft.id) {
      const baseSlug = slugify(draft.title) || "post";
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
      const { data, error } = await supabase
        .from("articles")
        .insert({ ...payload, slug })
        .select("id")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success(nowPublish ? "Published!" : "Draft saved");
      navigate({ to: "/write/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", draft.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      set("published", nowPublish);
      toast.success(nowPublish ? "Published!" : "Saved");
    }
  }

  async function remove() {
    if (!draft.id || !confirm("Delete this article?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", draft.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/dashboard" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="p-8 text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">
            {isNew ? "New article" : draft.published ? "Edit published" : "Edit draft"}
          </h1>
          <div className="flex flex-wrap gap-2">
            {draft.published ? (
              <Button variant="outline" onClick={() => save(false)} disabled={saving}>
                <Undo2 className="mr-2 h-4 w-4" /> Unpublish
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> Save draft
            </Button>
            <Button onClick={() => save(true)} disabled={saving}>
              <Send className="mr-2 h-4 w-4" /> {draft.published ? "Update" : "Publish"}
            </Button>
            {!isNew ? (
              <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="A great post title"
              className="text-lg"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cover">Cover image URL</Label>
              <Input
                id="cover"
                value={draft.cover_image_url}
                onChange={(e) => set("cover_image_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={draft.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="react, typescript"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={draft.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={2}
              placeholder="Short summary shown in the feed"
            />
          </div>

          <Tabs defaultValue="write" className="mt-2">
            <TabsList>
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write">
              <Textarea
                value={draft.content}
                onChange={(e) => set("content", e.target.value)}
                rows={22}
                placeholder="# Write your article in Markdown…"
                className="font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div
                className="markdown-body min-h-[400px] rounded-md border border-border/60 bg-card p-6"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.content || "*Nothing yet*") }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
