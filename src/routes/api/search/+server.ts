import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchConfigs } from "$lib/services/config-service";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const query = url.searchParams.get("q");
    
    if (!query) {
      return json({ error: "Search query is required" }, { status: 400 });
    }
    
    const results = await searchConfigs(query);
    
    return json({ results, count: results.length });
  } catch (error) {
    console.error("Error searching configs:", error);
    return json({ error: "Failed to search configs" }, { status: 500 });
  }
};
