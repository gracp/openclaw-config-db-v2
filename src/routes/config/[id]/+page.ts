import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

interface ConfigFile {
  id: string;
  filename: string;
  content: string;
  fileType: "workspace" | "config" | "skill" | "readme" | "other";
  fileSize: number;
}

interface Config {
  id: string;
  name: string;
  description?: string | null;
  author?: string | null;
  authorUrl?: string | null;
  sourceUrl?: string | null;
  sourceType: "github" | "upload" | "community";
  createdAt: string;
  updatedAt: string;
  stars: number;
  downloads: number;
  ratingAvg: number;
  ratingCount: number;
  healthScore?: number | null;
  isFeatured: boolean;
  files: ConfigFile[];
  tags: string[];
}

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/configs/${params.id}`);

  if (!res.ok) {
    throw error(404, "Config not found");
  }

  const config: Config = await res.json();

  // Parse dates
  config.createdAt = new Date(config.createdAt).toISOString();
  config.updatedAt = new Date(config.updatedAt).toISOString();

  // Analyze files to extract skills/tools
  const skills = analyzeSkills(config.files);

  // Build file tree structure
  const fileTree = buildFileTree(config.files);

  // Detect agent identity from config files
  const agentIdentity = detectAgentIdentity(config.files);

  // Calculate total size
  const totalSize = config.files.reduce((acc, f) => acc + f.fileSize, 0);

  // Detect setup complexity
  const complexity = detectComplexity(config.files, skills);

  return {
    config,
    skills,
    fileTree,
    agentIdentity,
    totalSize,
    complexity,
  };
};

function analyzeSkills(files: ConfigFile[]) {
  const skills: Array<{
    name: string;
    description: string;
    category: string;
    tags: string[];
  }> = [];

  // Check for skill definitions in files
  const skillFile = files.find((f) =>
    f.filename.includes("skill") ||
    f.filename.includes("AGENTS.md") ||
    f.filename.includes("SOUL.md")
  );

  if (skillFile?.content) {
    // Try to extract skill mentions from content
    const skillMentions = extractSkillMentions(skillFile.content);
    skills.push(...skillMentions);
  }

  // Check for tool definitions
  const toolFile = files.find((f) => f.filename.includes("TOOLS") || f.filename.includes("tools"));
  if (toolFile?.content) {
    const tools = extractToolMentions(toolFile.content);
    skills.push(...tools);
  }

  // If no specific skills found, infer from file structure
  if (skills.length === 0) {
    const hasDiscord = files.some((f) => f.filename.includes("discord") || f.content.includes("discord"));
    const hasEmail = files.some((f) => f.filename.includes("email") || f.content.includes("email"));
    const hasCalendar = files.some((f) => f.filename.includes("calendar") || f.content.includes("calendar"));

    if (hasDiscord) skills.push({ name: "Discord Integration", description: "Connects with Discord for messaging and notifications", category: "integration", tags: ["messaging", "social"] });
    if (hasEmail) skills.push({ name: "Email Management", description: "Handles email composition and sending", category: "automation", tags: ["productivity", "communication"] });
    if (hasCalendar) skills.push({ name: "Calendar Sync", description: "Manages calendar events and scheduling", category: "automation", tags: ["productivity", "scheduling"] });

    // Default based on file count
    if (skills.length === 0) {
      skills.push({
        name: "General Assistant",
        description: "A versatile OpenClaw agent configuration",
        category: "skill",
        tags: ["assistant", "productivity"],
      });
    }
  }

  return skills;
}

function extractSkillMentions(content: string): Array<{ name: string; description: string; category: string; tags: string[] }> {
  const skills: Array<{ name: string; description: string; category: string; tags: string[] }> = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Look for skill-like patterns
    const skillMatch = line.match(/(?:skill|tool|capability|feature)[:\s]+([A-Za-z\s-]+)/i);
    if (skillMatch) {
      const name = skillMatch[1].trim();
      if (name && name.length > 2 && name.length < 50) {
        skills.push({
          name,
          description: `Detected from ${skillMatch[0]}`,
          category: "skill",
          tags: ["detected"],
        });
      }
    }
  }

  return skills.slice(0, 8); // Limit to 8 skills
}

function extractToolMentions(content: string): Array<{ name: string; description: string; category: string; tags: string[] }> {
  const tools: Array<{ name: string; description: string; category: string; tags: string[] }> = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const toolMatch = line.match(/(?:tool|utility|service)[:\s]+([A-Za-z\s-]+)/i);
    if (toolMatch) {
      const name = toolMatch[1].trim();
      if (name && name.length > 2 && name.length < 50) {
        tools.push({
          name,
          description: `Detected tool: ${name}`,
          category: "tool",
          tags: ["detected"],
        });
      }
    }
  }

  return tools.slice(0, 6);
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  content?: string;
  fileType?: string;
  children?: FileNode[];
}

function buildFileTree(files: ConfigFile[]): FileNode[] {
  const root: Map<string, FileNode> = new Map();

  for (const file of files) {
    const parts = file.filename.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");

      if (!currentLevel.has(part)) {
        const node: FileNode = {
          name: part,
          type: isLast ? "file" : "folder",
          content: isLast ? file.content : undefined,
          fileType: isLast ? file.fileType : undefined,
          children: isLast ? undefined : [],
        };
        currentLevel.set(part, node);
      }

      if (!isLast && currentLevel.get(part)?.children) {
        const childrenMap = new Map<string, FileNode>();
        for (const child of currentLevel.get(part)!.children!) {
          childrenMap.set(child.name, child);
        }
        currentLevel = childrenMap;
      }
    }
  }

  return Array.from(root.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

interface AgentIdentity {
  name?: string;
  personality?: string[];
  channels?: string[];
  vibe?: string;
}

function detectAgentIdentity(files: ConfigFile[]): AgentIdentity {
  const identity: AgentIdentity = { personality: [], channels: [] };

  // Check SOUL.md and IDENTITY.md
  const soulFile = files.find((f) => f.filename.includes("SOUL.md"));
  const identityFile = files.find((f) => f.filename.includes("IDENTITY.md"));

  if (soulFile?.content) {
    // Extract personality traits
    const traits = extractPersonalityTraits(soulFile.content);
    identity.personality = traits;
    identity.vibe = extractVibe(soulFile.content);
  }

  if (identityFile?.content) {
    identity.name = extractName(identityFile.content);
  }

  // Detect channels
  const channelPatterns = [
    { name: "Discord", pattern: /discord/i },
    { name: "Slack", pattern: /slack/i },
    { name: "Email", pattern: /email/i },
    { name: "Telegram", pattern: /telegram/i },
    { name: "WhatsApp", pattern: /whatsapp/i },
  ];

  for (const file of files) {
    for (const cp of channelPatterns) {
      if (cp.pattern.test(file.filename) || cp.pattern.test(file.content)) {
        if (!identity.channels?.includes(cp.name)) {
          identity.channels?.push(cp.name);
        }
      }
    }
  }

  return identity;
}

function extractPersonalityTraits(content: string): string[] {
  const traits: string[] = [];
  const traitPatterns = [
    /helpful/i,
    /creative/i,
    /efficient/i,
    /friendly/i,
    /professional/i,
    /clever/i,
    /witty/i,
    /thorough/i,
    /concise/i,
  ];

  for (const pattern of traitPatterns) {
    if (pattern.test(content)) {
      traits.push(pattern.source.replace(/[^a-zA-Z]/g, "").toLowerCase());
    }
  }

  return traits.slice(0, 5);
}

function extractVibe(content: string): string {
  const vibePatterns = [
    { vibe: "Professional", pattern: /professional|corporate|business/i },
    { vibe: "Creative", pattern: /creative|artistic|imaginative/i },
    { vibe: "Friendly", pattern: /friendly|warm|approachable/i },
    { vibe: "Technical", pattern: /technical|developer|engineer/i },
    { vibe: "Assistant", pattern: /assistant|helper|agent/i },
  ];

  for (const vp of vibePatterns) {
    if (vp.pattern.test(content)) return vp.vibe;
  }

  return "Assistant";
}

function extractName(content: string): string | undefined {
  const nameMatch = content.match(/(?:name|called)[:\s]+([A-Za-z\s]+)/i);
  return nameMatch?.[1]?.trim();
}

function detectComplexity(files: ConfigFile[], skills: any[]): "simple" | "moderate" | "complex" {
  const fileCount = files.length;
  const skillCount = skills.length;
  const totalSize = files.reduce((acc, f) => acc + f.fileSize, 0);

  if (fileCount <= 5 && skillCount <= 3) return "simple";
  if (fileCount <= 15 && skillCount <= 8) return "moderate";
  return "complex";
}
