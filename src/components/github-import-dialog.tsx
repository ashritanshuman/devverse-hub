import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { renderMarkdown } from "@/lib/markdown";

export type GitHubImport = {
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  tags: string;
};

type RepoMeta = {
  name: string;
  full_name: string;
  description: string | null;
  owner: { login: string; avatar_url: string };
  topics?: string[];
  html_url: string;
};

function parseRepo(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/, "");
  const url = trimmed.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i);
  if (url) return { owner: url[1], repo: url[2] };
  const short = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (short) return { owner: short[1], repo: short[2] };
  return null;
}

export function GitHubImportDialog({
  onImport,
}: {
  onImport: (data: GitHubImport) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState<string>("");
  const [meta, setMeta] = useState<RepoMeta | null>(null);

  async function fetchRepo() {
    const parsed = parseRepo(input);
    if (!parsed) {
      toast.error("Enter a GitHub URL or owner/repo");
      return;
    }
    setLoading(true);
    setReadme("");
    setMeta(null);
    try {
      const base = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
      const headers = { Accept: "application/vnd.github+json" };
      const [repoRes, readmeRes] = await Promise.all([
        fetch(base, { headers }),
        fetch(`${base}/readme`, {
          headers: { Accept: "application/vnd.github.raw" },
        }),
      ]);
      if (!repoRes.ok) {
        throw new Error(
          repoRes.status === 404 ? "Repository not found" : `GitHub error ${repoRes.status}`,
        );
      }
      if (!readmeRes.ok) {
        throw new Error(
          readmeRes.status === 404 ? "No README found in this repo" : `README error ${readmeRes.status}`,
        );
      }
      const repoData = (await repoRes.json()) as RepoMeta;
      const readmeText = await readmeRes.text();
      setMeta(repoData);
      setReadme(readmeText);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  function useAsDraft() {
    if (!meta || !readme) return;
    const intro = meta.description ? `> ${meta.description}\n\n` : "";
    const source = `\n\n---\n\nSource: [${meta.full_name}](${meta.html_url})\n`;
    onImport({
      title: meta.name.replace(/[-_]/g, " "),
      excerpt: meta.description ?? "",
      content: `# ${meta.name}\n\n${intro}${readme}${source}`,
      cover_image_url: meta.owner.avatar_url,
      tags: (meta.topics ?? []).slice(0, 6).join(", "),
    });
    toast.success("Draft populated from GitHub");
    setOpen(false);
    setInput("");
    setReadme("");
    setMeta(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Github className="mr-2 h-4 w-4" /> Import from GitHub
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Pull a public repository's README and turn it into a draft article.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="repo">Repository URL or owner/repo</Label>
          <div className="flex gap-2">
            <Input
              id="repo"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="vercel/next.js or https://github.com/vercel/next.js"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchRepo();
                }
              }}
            />
            <Button onClick={fetchRepo} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-2">Fetch</span>
            </Button>
          </div>
        </div>

        {meta ? (
          <div className="mt-2 rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="font-medium">{meta.full_name}</div>
            {meta.description ? (
              <div className="text-muted-foreground">{meta.description}</div>
            ) : null}
            {meta.topics && meta.topics.length > 0 ? (
              <div className="mt-1 text-xs text-muted-foreground">
                Topics: {meta.topics.join(", ")}
              </div>
            ) : null}
          </div>
        ) : null}

        {readme ? (
          <div
            className="markdown-body max-h-[45vh] overflow-auto rounded-md border border-border/60 bg-card p-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(readme) }}
          />
        ) : (
          <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            README preview will appear here
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={useAsDraft} disabled={!readme || !meta}>
            Use as draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
