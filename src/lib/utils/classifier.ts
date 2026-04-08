interface ClassificationResult {
  suggestedTags: string[];
  useCase: string;
  complexity: "beginner" | "intermediate" | "advanced";
  detectedPatterns: string[];
}

const PERSONA_PATTERNS = {
  developer: [
    /\b(developer|engineer|programmer|coder)\b/i,
    /\b(code|git|github|api|typescript|javascript|python|rust|go)\b/i,
    /\b(cli|terminal|bash|shell|script)\b/i,
    /\b(database|sql|postgres|mongodb)\b/i,
    /\b(docker|kubernetes|devops|ci\/cd)\b/i,
  ],
  marketer: [
    /\b(marketing|seo|sem|ads|advertising)\b/i,
    /\b(social media|content|copywriting|brand)\b/i,
    /\b(campaign|funnel|conversion|leads)\b/i,
    /\b(analytics|google|meta|facebook|twitter)\b/i,
  ],
  "solo-founder": [
    /\b(startup|founder|entrepreneur|saas)\b/i,
    /\b(product|launch|mvp|market)\b/i,
    /\b(business|revenue|growth)\b/i,
  ],
};

const USE_CASE_PATTERNS = {
  automation: [
    /\b(automate|automation|workflow|routine)\b/i,
    /\b(schedule|cron|trigger|hook)\b/i,
  ],
  "multi-agent": [
    /\b(multi-agent|multiagent|agent.?agent|collaborat)\b/i,
    /\b(subagent|delega|orchestrat)\b/i,
  ],
  api: [
    /\bapi|endpoint|rest|graphql|webhook/i,
  ],
  discord: [
    /\b(discord|server|channel|role|emoji)\b/i,
  ],
};

const COMPLEXITY_INDICATORS = {
  beginner: [
    /\b(tutorial|guide|beginner|simple|basic|start)\b/i,
    /\b(first.?time|getting.?started|starter)\b/i,
  ],
  advanced: [
    /\b(advanced|expert|complex|sophisticated|enterprise)\b/i,
    /\b(multi.?step|pipeline|orchestrat)\b/i,
  ],
};

export function autoClassify(content: string): ClassificationResult {
  const detectedPatterns: string[] = [];
  const suggestedTags: string[] = [];

  for (const [persona, patterns] of Object.entries(PERSONA_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        suggestedTags.push(persona);
        detectedPatterns.push(`persona:${persona}`);
        break;
      }
    }
  }

  for (const [useCase, patterns] of Object.entries(USE_CASE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        suggestedTags.push(useCase);
        detectedPatterns.push(`use_case:${useCase}`);
        break;
      }
    }
  }

  let complexity: "beginner" | "intermediate" | "advanced" = "intermediate";
  let maxScore = 0;

  for (const [level, patterns] of Object.entries(COMPLEXITY_INDICATORS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      complexity = level as "beginner" | "advanced";
    }
  }

  suggestedTags.push(complexity);
  detectedPatterns.push(`complexity:${complexity}`);

  const useCase = suggestedTags.find(t =>
    ["automation", "multi-agent", "api", "discord"].includes(t)
  ) || "general";

  return {
    suggestedTags: [...new Set(suggestedTags)],
    useCase,
    complexity,
    detectedPatterns,
  };
}

export function classifyFileType(filename: string, content: string): "workspace" | "config" | "skill" | "readme" | "other" {
  const lower = filename.toLowerCase();

  if (lower === "soul.md" || lower === "agents.md" || lower === "identity.md" || lower === "user.md" || lower === "memory.md") {
    return "workspace";
  }
  if (lower.endsWith(".md") && (lower.includes("readme") || lower.includes("guide") || lower.includes("doc"))) {
    return "readme";
  }
  if (lower.includes("skill")) {
    return "skill";
  }
  if (lower.endsWith(".json") || lower.endsWith(".yaml") || lower.endsWith(".yml") || lower.endsWith(".toml")) {
    return "config";
  }

  return "other";
}
