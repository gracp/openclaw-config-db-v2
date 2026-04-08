import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getConfigById, incrementDownloads } from "$lib/services/config-service";
import JSZip from "jszip";

export const GET: RequestHandler = async ({ params }) => {
  try {
    const config = await getConfigById(params.id);

    if (!config) {
      return json({ error: "Config not found" }, { status: 404 });
    }

    const zip = new JSZip();
    const folder = zip.folder(config.name.replace(/[^a-zA-Z0-9]/g, "_"));

    if (!folder) {
      return json({ error: "Failed to create zip folder" }, { status: 500 });
    }

    for (const file of config.files) {
      folder.file(file.filename, file.content);
    }

    const zipBase64 = await zip.generateAsync({ type: "base64" });
    const zipBuffer = Buffer.from(zipBase64, "base64");

    incrementDownloads(params.id).catch(console.error);

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${config.name.replace(/[^a-zA-Z0-9]/g, "_")}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading config:", error);
    return json({ error: "Failed to download config" }, { status: 500 });
  }
};
