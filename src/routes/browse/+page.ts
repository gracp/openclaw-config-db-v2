import type { PageLoad } from "./$types";

interface Config {
  id: string;
  name: string;
  description?: string | null;
  author?: string | null;
  stars: number;
  downloads: number;
  tags: string[];
  sourceType: "github" | "upload" | "community";
  isFeatured: boolean;
}

export const load: PageLoad = async ({ fetch, url }) => {
  const search = url.searchParams.get("search") || "";
  const tag = url.searchParams.get("tag") || "";
  const sortBy = url.searchParams.get("sortBy") || "created";
  const page = parseInt(url.searchParams.get("page") || "1");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (tag) params.set("tag", tag);
  params.set("sortBy", sortBy);
  params.set("page", page.toString());
  params.set("limit", "12");

  const [configsRes, tagsRes] = await Promise.all([
    fetch(`/api/configs?${params}`),
    fetch("/api/tags"),
  ]);

  const configsData = await configsRes.json();
  const tagsData = await tagsRes.json();

  return {
    configs: (configsData.configs || []) as (Config & { fileCount?: number })[],
    total: configsData.total || 0,
    page,
    tags: tagsData as Record<string, string[]>,
    search,
    tag,
    sortBy,
  };
};
