import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getConfigById } from "$lib/services/config-service";

export const GET: RequestHandler = async ({ params }) => {
  try {
    const config = await getConfigById(params.id);

    if (!config) {
      return json({ error: "Config not found" }, { status: 404 });
    }

    return json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    return json({ error: "Failed to fetch config" }, { status: 500 });
  }
};
