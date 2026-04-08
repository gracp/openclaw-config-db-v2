import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAllTags } from "$lib/services/config-service";

export const GET: RequestHandler = async () => {
  try {
    const tags = await getAllTags();
    return json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return json({ error: "Failed to fetch tags" }, { status: 500 });
  }
};
