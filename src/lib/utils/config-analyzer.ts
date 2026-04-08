import { extractHeadings, type Heading } from "./markdown-toc";

export interface ConfigFile {
  id: string;
  filename: string;
  content: string;
  fileType: "workspace" | "config" | "skill" | "readme" | "other";
  fileSize: number;
}

export interface ClassifiedFiles {
  identity: ConfigFile[];
  operations: ConfigFile[];
  skills: ConfigFile[];
  configuration: ConfigFile[];
  knowledge: ConfigFile[];
}

const IDENTITY_FILES = [
  "SOUL.md", "IDENTITY.md",
  "workspace/SOUL.md", "workspace/IDENTITY.md",
  "templates/SOUL.md", "templates/IDENTITY.md",
];

const OPERATIONS_FILES = [
  "AGENTS.md", "TOOLS.md", "HEARTBEAT.md", "BOOTSTRAP.md",
  "docs/TOOLS.md",
];

const CONFIG_EXTENSIONS = [".json", ".yaml", ".yml", ".toml", ".env.example", "Dockerfile"];

export function classifyFiles(files: ConfigFile[]): ClassifiedFiles {
  const result: ClassifiedFiles = {
    identity: [],
    operations: [],
    skills: [],
    configuration: [],
    knowledge: [],
  };

  for (const file of files) {
    const basename = file.filename.split("/").pop() || file.filename;

    if (basename === "SKILL.md" || file.fileType === "skill") {
      result.skills.push(file);
      continue;
    }

    if (IDENTITY_FILES.includes(file.filename) || IDENTITY_FILES.includes(basename)) {
      result.identity.push(file);
      continue;
    }

    if (OPERATIONS_FILES.includes(file.filename) || OPERATIONS_FILES.includes(basename)) {
      result.operations.push(file);
      continue;
    }

    if (
      basename === "openclaw.json" || basename === "openclaw.example.json" ||
      basename === "config/openclaw.json" ||
      CONFIG_EXTENSIONS.some(ext => basename.endsWith(ext))
    ) {
      result.configuration.push(file);
      continue;
    }

    result.knowledge.push(file);
  }

  result.identity.sort((a, b) => {
    const order = (f: ConfigFile) => {
      const base = f.filename.split("/").pop() || f.filename;
      return base === "SOUL.md" ? 0 : base === "IDENTITY.md" ? 1 : 2;
    };
    return order(a) - order(b);
  });

  result.operations.sort((a, b) => {
    const order = (f: ConfigFile) => {
      const base = f.filename.split("/").pop() || f.filename;
      const idx = ["AGENTS.md", "TOOLS.md", "HEARTBEAT.md", "BOOTSTRAP.md"].indexOf(base);
      return idx === -1 ? 99 : idx;
    };
    return order(a) - order(b);
  });

  return result;
}

export interface ArchitectureNode {
  label: string;
  sublabel?: string;
  type: "agent" | "channel" | "tool" | "skill";
}

export interface Architecture {
  agent: ArchitectureNode | null;
  channels: ArchitectureNode[];
  tools: ArchitectureNode[];
  skills: ArchitectureNode[];
}

export function extractArchitecture(files: ConfigFile[]): Architecture {
  const arch: Architecture = { agent: null, channels: [], tools: [], skills: [] };

  const soulFile = files.find(f => f.filename.endsWith("SOUL.md"));
  const identityFile = files.find(f => f.filename.endsWith("IDENTITY.md"));

  if (identityFile?.content) {
    const nameMatch = identityFile.content.match(/-\s*\*\*Name:\*\*\s*(.+)/);
    if (nameMatch) {
      arch.agent = { label: nameMatch[1].trim(), type: "agent" };
    }
  }

  if (!arch.agent && soulFile?.content) {
    const nameMatch = soulFile.content.match(/(?:name is|I'm|call me)\s+(\w+)/i);
    if (nameMatch) {
      arch.agent = { label: nameMatch[1].trim(), type: "agent" };
    } else {
      arch.agent = { label: "Agent", type: "agent" };
    }
  }

  if (!arch.agent) {
    arch.agent = { label: "Agent", type: "agent" };
  }

  const agentsFile = files.find(f => f.filename.endsWith("AGENTS.md"));
  if (agentsFile?.content) {
    const channelKeywords = [
      { pattern: /telegram|tgcli/i, label: "Telegram" },
      { pattern: /discord/i, label: "Discord" },
      { pattern: /slack/i, label: "Slack" },
      { pattern: /whatsapp|wacli/i, label: "WhatsApp" },
      { pattern: /imessage|imsg/i, label: "iMessage" },
      { pattern: /email|himalaya/i, label: "Email" },
      { pattern: /twitter|x\.com/i, label: "Twitter/X" },
      { pattern: /webhook|api/i, label: "Webhook/API" },
    ];
    for (const { pattern, label } of channelKeywords) {
      if (pattern.test(agentsFile.content)) {
        if (!arch.channels.find(c => c.label === label)) {
          arch.channels.push({ label, type: "channel" });
        }
      }
    }
  }

  const toolsFile = files.find(f => f.filename.endsWith("TOOLS.md"));
  if (toolsFile?.content) {
    const toolKeywords = [
      { pattern: /docker/i, label: "Docker" },
      { pattern: /github/i, label: "GitHub" },
      { pattern: /browser|playwright|puppeteer/i, label: "Browser" },
      { pattern: /calendar|gcal/i, label: "Calendar" },
      { pattern: /ssh/i, label: "SSH" },
      { pattern: /tts|elevenlabs|voice/i, label: "Voice/TTS" },
      { pattern: /ffmpeg|video|image/i, label: "Media" },
    ];
    for (const { pattern, label } of toolKeywords) {
      if (pattern.test(toolsFile.content)) {
        if (!arch.tools.find(t => t.label === label)) {
          arch.tools.push({ label, type: "tool" });
        }
      }
    }
  }

  for (const file of files) {
    if (file.filename.endsWith("SKILL.md")) {
      const parts = file.filename.split("/");
      const skillIdx = parts.lastIndexOf("skills");
      if (skillIdx >= 0 && skillIdx + 1 < parts.length) {
        const skillName = parts[skillIdx + 1];
        if (!arch.skills.find(s => s.label === skillName)) {
          arch.skills.push({ label: skillName, type: "skill" });
        }
      }
    }
  }

  return arch;
}

export function extractTableOfContents(content: string): Heading[] {
  return extractHeadings(content);
}

export interface SkillMetadata {
  name: string;
  description: string;
  files: ConfigFile[];
}

export function parseSkillMetadata(content: string): { name: string; description: string } {
  const descMatch = content.match(/^#\s+(.+)\n/i);
  const nameMatch = content.match(/(?:skill|name)[:\s]+(.+)/i);

  return {
    name: nameMatch?.[1]?.trim() || "",
    description: descMatch?.[1]?.trim() || "",
  };
}

export function groupSkills(skillFiles: ConfigFile[]): SkillMetadata[] {
  const groups = new Map<string, ConfigFile[]>();

  for (const file of skillFiles) {
    const parts = file.filename.split("/");
    const skillIdx = parts.lastIndexOf("skills");
    let groupName: string;

    if (skillIdx >= 0 && skillIdx + 1 < parts.length) {
      groupName = parts[skillIdx + 1];
    } else {
      groupName = file.filename;
    }

    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName)!.push(file);
  }

  return Array.from(groups.entries()).map(([name, files]) => {
    const skillMd = files.find(f => f.filename.endsWith("SKILL.md"));
    const meta = skillMd ? parseSkillMetadata(skillMd.content) : { name, description: "" };
    return {
      name: meta.name || name,
      description: meta.description,
      files,
    };
  });
}

export interface AgentIdentity {
  name: string;
  emoji: string;
  creature: string;
  vibe: string;
  description: string;
}

export function getAgentIdentity(files: ConfigFile[]): AgentIdentity {
  const identity: AgentIdentity = { name: "", emoji: "", creature: "", vibe: "", description: "" };

  const identityFile = files.find(f => f.filename.endsWith("IDENTITY.md"));
  if (identityFile?.content) {
    const extract = (pattern: RegExp) => identityFile.content.match(pattern)?.[1]?.trim() || "";
    identity.name = extract(/-\s*\*\*Name:\*\*\s*(.+)/);
    identity.emoji = extract(/-\s*\*\*Emoji:\*\*\s*(.+)/);
    identity.creature = extract(/-\s*\*\*Creature:\*\*\s*(.+)/);
    identity.vibe = extract(/-\s*\*\*Vibe:\*\*\s*(.+)/);
  }

  const soulFile = files.find(f => f.filename.endsWith("SOUL.md"));
  if (soulFile?.content) {
    const lines = soulFile.content.split("\n").filter(l => l.trim() && !l.startsWith("#"));
    identity.description = lines.slice(0, 2).join(" ").trim();
  }

  return identity;
}

export interface ConfigStats {
  totalFiles: number;
  totalSize: number;
  skillCount: number;
  workspaceFileCount: number;
  configFileCount: number;
  readmeCount: number;
  otherCount: number;
}

export function getConfigStats(files: ConfigFile[]): ConfigStats {
  const stats: ConfigStats = {
    totalFiles: files.length,
    totalSize: 0,
    skillCount: 0,
    workspaceFileCount: 0,
    configFileCount: 0,
    readmeCount: 0,
    otherCount: 0,
  };

  for (const file of files) {
    stats.totalSize += file.fileSize;
    switch (file.fileType) {
      case "skill": stats.skillCount++; break;
      case "workspace": stats.workspaceFileCount++; break;
      case "config": stats.configFileCount++; break;
      case "readme": stats.readmeCount++; break;
      default: stats.otherCount++; break;
    }
  }

  return stats;
}

export function extractFileDescription(filename: string, content: string): string {
  const basename = filename.split("/").pop() || filename;
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  if (basename === "SKILL.md") {
    const h = lines.find(l => l.startsWith("# "));
    return h ? h.replace(/^#+\s*/, "") : "Skill plugin";
  }

  if (basename === "SOUL.md") {
    const first = lines.find(l => !l.startsWith("#") && !l.startsWith("<!--"));
    return first ? first.slice(0, 80) + (first.length > 80 ? "…" : "") : "Agent personality & identity";
  }

  if (basename === "IDENTITY.md") {
    return "Agent name, emoji, vibe & creature definition";
  }

  if (basename === "AGENTS.md") {
    return "Operating rules, delegation & session behavior";
  }

  if (basename === "TOOLS.md") {
    return "Local tool configuration & environment notes";
  }

  if (basename === "HEARTBEAT.md") {
    return "Periodic heartbeat task checklist";
  }

  if (basename === "BOOTSTRAP.md") {
    return "First-run setup instructions";
  }

  if (basename === "openclaw.json" || basename.endsWith(".json")) {
    return "OpenClaw gateway configuration";
  }
  if (basename.endsWith(".yaml") || basename.endsWith(".yml")) {
    return "YAML configuration file";
  }

  const first = lines.find(l => !l.startsWith("#") && !l.startsWith("<!--") && !l.startsWith("---"));
  return first ? first.slice(0, 80) + (first.length > 80 ? "…" : "") : basename;
}

export interface AgentProfile {
  name: string;
  emoji: string;
  role: string;
  traits: string[];
  boundaries: string[];
  style: string;
  fullDescription: string;
}

export function extractAgentProfile(files: ConfigFile[]): AgentProfile {
  const profile: AgentProfile = {
    name: "", emoji: "", role: "", traits: [], boundaries: [], style: "", fullDescription: "",
  };

  const identityFile = files.find(f => f.filename.endsWith("IDENTITY.md"));
  if (identityFile?.content) {
    const ex = (pattern: RegExp) => identityFile.content.match(pattern)?.[1]?.trim() || "";
    profile.name = ex(/-\s*\*\*Name:\*\*\s*(.+)/);
    profile.emoji = ex(/-\s*\*\*Emoji:\*\*\s*(.+)/);
    profile.style = ex(/-\s*\*\*Vibe:\*\*\s*(.+)/);
    profile.role = ex(/-\s*\*\*Creature:\*\*\s*(.+)/);
  }

  const soulFile = files.find(f => f.filename.endsWith("SOUL.md"));
  if (soulFile?.content) {
    const content = soulFile.content;
    profile.fullDescription = content;

    const extractSection = (title: string): string[] => {
      const pattern = new RegExp(`##\s+${title}[^#]*?\n([\s\S]*?)(?=\n##|$)`, "i");
      const match = content.match(pattern);
      if (!match) return [];
      return match[1]
        .split("\n")
        .map(l => l.replace(/^[-*]\s*/, "").replace(/^\*\*([^*]+)\*\*[:\s]*/, "$1: ").trim())
        .filter(l => l.length > 0);
    };

    const coreSection = extractSection("Core Truths");
    if (coreSection.length > 0) profile.traits = coreSection;
    else {
      const persSection = extractSection("Personality");
      if (persSection.length > 0) profile.traits = persSection;
    }

    profile.boundaries = extractSection("Boundaries");

    if (!profile.role) {
      const roleMatch = content.match(/(?:role|you are)\s*(?:a|an)\s+([^.\n]+)/i);
      if (roleMatch) profile.role = roleMatch[1].trim();
    }
  }

  return profile;
}

export function detectChannels(files: ConfigFile[]): string[] {
  const channels: string[] = [];
  const allContent = files.map(f => f.content).join("\n");
  const channelMap: [RegExp, string][] = [
    [/telegram|tgcli/i, "Telegram"],
    [/discord/i, "Discord"],
    [/slack/i, "Slack"],
    [/whatsapp|wacli/i, "WhatsApp"],
    [/imessage|imsg/i, "iMessage"],
    [/email|himalaya/i, "Email"],
    [/twitter|x\.com/i, "Twitter/X"],
    [/webhook/i, "Webhook"],
  ];
  for (const [pattern, label] of channelMap) {
    if (pattern.test(allContent) && !channels.includes(label)) channels.push(label);
  }
  return channels;
}

export type Complexity = "beginner" | "intermediate" | "advanced";

export function detectComplexity(files: ConfigFile[]): Complexity {
  const count = files.length;
  const skillCount = files.filter(f => f.filename.endsWith("SKILL.md") || f.fileType === "skill").length;
  const hasConfig = files.some(f => f.filename.includes(".json") || f.filename.includes(".yaml"));

  if (count <= 3 && skillCount === 0 && !hasConfig) return "beginner";
  if (count <= 8 && skillCount <= 2) return "intermediate";
  return "advanced";
}

export interface SetupStep {
  step: number;
  title: string;
  command?: string;
  description: string;
}

export function generateSetupSteps(files: ConfigFile[]): SetupStep[] {
  const steps: SetupStep[] = [];
  const hasConfig = files.some(f => f.filename === "openclaw.json" || f.filename.includes("config/openclaw.json"));
  const hasSkills = files.some(f => f.fileType === "skill" || f.filename.endsWith("SKILL.md"));
  const hasEnv = files.some(f => f.filename.includes(".env"));
  const hasDocker = files.some(f => f.filename === "Dockerfile" || f.content?.toLowerCase().includes("docker"));

  steps.push({
    step: 1, title: "Copy workspace files",
    command: "cp -r ./config-files/* ~/.openclaw/workspace/",
    description: "Copy all markdown files to your OpenClaw workspace directory",
  });

  if (hasConfig) {
    steps.push({
      step: steps.length + 1, title: "Copy configuration",
      command: "cp openclaw.json ~/.openclaw/",
      description: "Place the gateway config in your OpenClaw root directory",
    });
  }

  if (hasEnv) {
    steps.push({
      step: steps.length + 1, title: "Set up environment variables",
      command: "cp .env.example ~/.openclaw/.env",
      description: "Copy the env template and fill in your API keys and secrets",
    });
  }

  if (hasSkills) {
    steps.push({
      step: steps.length + 1, title: "Install skill dependencies",
      command: undefined,
      description: "Check each skill's SKILL.md for required tools or API keys",
    });
  }

  steps.push({
    step: steps.length + 1, title: "Restart gateway",
    command: "openclaw gateway restart",
    description: "Restart OpenClaw to pick up the new configuration",
  });

  steps.push({
    step: steps.length + 1, title: "Verify setup",
    command: "openclaw doctor",
    description: "Run diagnostics to make sure everything is configured correctly",
  });

  return steps;
}

export function detectDependencies(files: ConfigFile[]): string[] {
  const deps = new Set<string>();
  const allContent = files.map(f => f.content).join("\n");
  const depPatterns: [RegExp, string][] = [
    [/elevenlabs/i, "ElevenLabs (TTS)"],
    [/openai/i, "OpenAI API"],
    [/anthropic/i, "Anthropic API"],
    [/github.*token|gh_\w+/i, "GitHub Token"],
    [/docker/i, "Docker"],
    [/ffmpeg/i, "FFmpeg"],
    [/himalaya/i, "Himalaya (email CLI)"],
    [/playwright|puppeteer/i, "Playwright (browser)"],
    [/google.*calendar|gcal/i, "Google Calendar"],
    [/telegram.*bot.*token|tgcli/i, "Telegram Bot Token"],
    [/discord.*bot.*token/i, "Discord Bot Token"],
  ];
  for (const [pattern, label] of depPatterns) {
    if (pattern.test(allContent)) deps.add(label);
  }
  return Array.from(deps);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
