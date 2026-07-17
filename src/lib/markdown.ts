import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export function estimateReadingTime(md: string): number {
  const words = md.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
