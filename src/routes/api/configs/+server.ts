import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAllConfigs } from "$lib/services/config-service";

export const GET: RequestHandler = async ({ url }) => {
  try {
    let page = parseInt(url.searchParams.get("page") || "1");
    let limit = parseInt(url.searchParams.get("limit") || "20");
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    
    const search = url.searchParams.get("search") || undefined;
    const tagParams = url.searchParams.getAll("tag");
    const author = url.searchParams.get("author") || undefined;
    const complexity = url.searchParams.get("complexity") as "simple" | "moderate" | "complex" | undefined;
    const sourceType = url.searchParams.get("sourceType") as "github" | "upload" | "community" | undefined;
    const sortBy = url.searchParams.get("sortBy") as "stars" | "downloads" | "created" | "rating" || "created";
    
    const result = await getAllConfigs({
      page,
      limit,
      search,
      tags: tagParams.length > 0 ? tagParams : undefined,
      author,
      complexity,
      sourceType,
      sortBy,
    });
    
    return json(result);
  } catch (error) {
    console.error("Error fetching configs:", error);
    return json({ error: "Failed to fetch configs" }, { status: 500 });
  }
};
