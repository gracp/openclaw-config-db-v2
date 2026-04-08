import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createConfig } from "$lib/services/config-service";

const ALLOWED_EXTENSIONS = [".md", ".json", ".txt"];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const author = formData.get("author") as string | null;
    const authorUrl = formData.get("authorUrl") as string | null;
    const sourceUrl = formData.get("sourceUrl") as string | null;
    const sourceType = (formData.get("sourceType") as "github" | "upload" | "community") || "upload";
    
    if (!["github", "upload", "community"].includes(sourceType)) {
      return json({ error: "Invalid sourceType. Must be github, upload, or community." }, { status: 400 });
    }
    
    if (!name) {
      return json({ error: "Config name is required" }, { status: 400 });
    }
    
    const files: Array<{ filename: string; content: string }> = [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    let totalSize = 0;
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("files[") && value instanceof File) {
        const filename = value.name;
        
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
          return json({ error: "Invalid filename. Path traversal not allowed." }, { status: 400 });
        }
        
        const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return json({ error: `File type ${ext} is not allowed. Only .md, .json, .txt are accepted.` }, { status: 400 });
        }
        
        const content = await value.text();
        totalSize += content.length;
        
        if (content.length > MAX_FILE_SIZE) {
          return json({ error: `File ${filename} exceeds maximum size of 5MB.` }, { status: 400 });
        }
        
        files.push({ filename, content });
      }
    }
    
    if (totalSize > MAX_TOTAL_SIZE) {
      return json({ error: "Total file size exceeds maximum of 50MB." }, { status: 400 });
    }
    
    if (files.length === 0) {
      return json({ error: "At least one file is required" }, { status: 400 });
    }
    
    const result = await createConfig(
      {
        name,
        description: description || undefined,
        author: author || undefined,
        authorUrl: authorUrl || undefined,
        sourceUrl: sourceUrl || undefined,
        sourceType,
      },
      files
    );
    
    return json({
      success: true,
      id: result.id,
      suggestedTags: result.suggestedTags,
    });
  } catch (error) {
    console.error("Error creating config:", error);
    return json({ error: "Failed to create config" }, { status: 500 });
  }
};
