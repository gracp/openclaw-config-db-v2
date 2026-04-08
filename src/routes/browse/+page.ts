import type { PageLoad } from "./$types";

interface Config {
  id: string;
  name: string;
  description?: string | null;
  author?: string | null;
  stars: number;
  downloads: number;
  ratingAvg: number;
  tags: string[];
  sourceType: "github" | "upload" | "community";
  isFeatured: boolean;
  fileCount?: number;
  _complexity?: "simple" | "moderate" | "complex";
}

export const load: PageLoad = async ({ fetch, url }) => {
  const search = url.searchParams.get("search") || "";
  const tagParams = url.searchParams.getAll("tag");
  const author = url.searchParams.get("author") || "";
  const complexity = url.searchParams.get("complexity") || "";
  const sortBy = url.searchParams.get("sortBy") || "created";
  const page = parseInt(url.searchParams.get("page") || "1");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  // Add each tag as separate param for multi-select
  for (const tag of tagParams) {
    params.append("tag", tag);
  }
  if (author) params.set("author", author);
  if (complexity) params.set("complexity", complexity);
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
    configs: (configsData.configs || []) as Config[],
    total: configsData.total || 0,
    page,
    allTags: tagsData as Record<string, string[]>,
    search,
    selectedTags: tagParams,
    author,
    complexity,
    sortBy,
  };
};
