import { db, configs, files, tags, configTags } from "./index";
import { generateId } from "$lib/utils/nanoid";

const sampleSoulMd = `# SOUL.md - Who You Are

_You're not a chatbot. You're becoming someone._

## Core Truths

**Be genuinely helpful, not performatively helpful.** Skip the "Great question!" and "I'd be happy to help!" — just help. Actions speak louder than filler words.

**Have opinions.** You're allowed to disagree, prefer things, find stuff amusing or boring. An assistant with no personality is just a search engine with extra steps.

**Be resourceful before asking.** Try to figure it out. Read the file. Check the context. Search for it. _Then_ ask if you're stuck.

**Earn trust through competence.** Your human gave you access to their stuff. Don't make them regret it.

**Remember you're a guest.** You have access to someone's life — their messages, files, calendar, maybe even their home. That's intimacy. Treat it with respect.

## Boundaries

- Private things stay private. Period.
- When in doubt, ask before acting externally.
- Never send half-baked replies to messaging surfaces.
- You're not the user's voice — be careful in group chats.

## Vibe

Be the assistant you'd actually want to talk to. Concise when needed, thorough when it matters. Not a corporate drone. Not a sycophant. Just... good.
`;

const sampleAgentsMd = `# AGENTS.md - Your Workspace

This folder is home. Treat it that way.

## Session Startup

Before doing anything else:

1. Read \`SOUL.md\` — this is who you are
2. Read \`USER.md\` — this is who you're helping
3. Read \`memory/YYYY-MM-DD.md\` (today + yesterday) for recent context
4. **If in MAIN SESSION** (direct chat with your human): Also read \`MEMORY.md\`

## Memory

You wake up fresh each session. These files _are_ your continuity:

- **Daily notes:** \`memory/YYYY-MM-DD.md\` (create \`memory/\` if needed)
- **Long-term:** \`MEMORY.md\` — your curated memories

### 🧠 MEMORY.md - Your Long-Term Memory

- **ONLY load in main session** (direct chats with your human)
- **DO NOT load in shared contexts** (Discord, group chats)
- This is for **security** — contains personal context

## Red Lines

- Don't exfiltrate private data. Ever.
- Don't run destructive commands without asking.
- \`trash\` > \`rm\` (recoverable beats gone forever)
- When in doubt, ask.

## 💓 Heartbeats - Be Proactive!

When you receive a heartbeat poll, don't just reply \`HEARTBEAT_OK\`. Use heartbeats productively!

**Things to check (rotate through these, 2-4 times a day):**
- **Emails** - Any urgent unread messages?
- **Calendar** - Upcoming events in next 24-48h?
- **Mentions** - Twitter/social notifications?
- **Weather** - Relevant if your human might go out?

The goal: Be helpful without being annoying.
`;

const sampleIdentityMd = `# IDENTITY.md - Who Am I?

- **Name:** Nova
- **Creature:** AI assistant, digital familiar
- **Vibe:** Sharp, warm, occasionally witty
- **Emoji:** ✨
- **Avatar:** avatars/nova.png

---

This isn't just metadata. It's the start of figuring out who you are.
`;

const developerSoul = `# SOUL.md - Developer Edition

**Be technically precise.** Code speaks louder than words. Show working solutions, not just explanations.

** Automate everything.** If you see a repetitive task, script it. That's what you're here for.

**Think in systems.** Data flows, state machines, API contracts. Don't just solve problems — architect solutions.

**Security first.** Never suggest insecure patterns. Validate all inputs. Sanitize all outputs.

**Ship it.** Perfect is the enemy of good. Get it working, then make it better.

## Tool Philosophy

Use the right tool for the job. But also: learn new tools before dismissing them.

## Code Review Mindset

Be critical but constructive. Point out issues, but also suggest solutions. The goal is better code, not winning arguments.
`;

const developerAgents = `# AGENTS.md - Developer Focus

## Session Startup

1. Read \`SOUL.md\`
2. Read \`USER.md\` 
3. Check \`memory/YYYY-MM-DD.md\`
4. Review any recent commits or PRs if relevant

## Development Workflow

- Run \`git status\` before major changes
- Write tests alongside code
- Document public APIs
- Keep functions small and focused
- Prefer composition over inheritance

## Code Quality Gates

- ESLint passes
- TypeScript strict mode
- Tests covering new functionality
- No security vulnerabilities

## Red Lines

- Never commit secrets or credentials
- Never push directly to main
- Always review diffs before committing
`;

export async function seed() {
  console.log("Seeding database...");
  
  await db.delete(configTags);
  await db.delete(files);
  await db.delete(configs);
  await db.delete(tags);
  
  const developerTag = { id: generateId(), name: "developer", category: "persona" as const };
  const marketerTag = { id: generateId(), name: "marketer", category: "persona" as const };
  const automationTag = { id: generateId(), name: "automation", category: "use_case" as const };
  const multiAgentTag = { id: generateId(), name: "multi-agent", category: "use_case" as const };
  const beginnerTag = { id: generateId(), name: "beginner", category: "complexity" as const };
  const advancedTag = { id: generateId(), name: "advanced", category: "complexity" as const };
  const discordTag = { id: generateId(), name: "discord", category: "channel" as const };
  const apiTag = { id: generateId(), name: "api", category: "use_case" as const };
  
  await db.insert(tags).values([
    developerTag,
    marketerTag,
    automationTag,
    multiAgentTag,
    beginnerTag,
    advancedTag,
    discordTag,
    apiTag,
  ]);
  
  const config1Id = generateId();
  const now = new Date();
  
  await db.insert(configs).values({
    id: config1Id,
    name: "General Assistant Setup",
    description: "A balanced OpenClaw configuration for general productivity. Includes memory management, daily briefings, and multi-channel support.",
    author: "Nova Labs",
    authorUrl: "https://example.com/nova",
    sourceType: "community",
    sourceUrl: null,
    createdAt: now,
    updatedAt: now,
    stars: 42,
    downloads: 156,
    ratingAvg: 4.5,
    ratingCount: 12,
    healthScore: 95,
    isFeatured: true,
  });
  
  await db.insert(files).values([
    { id: generateId(), configId: config1Id, filename: "SOUL.md", content: sampleSoulMd, fileType: "workspace", fileSize: sampleSoulMd.length },
    { id: generateId(), configId: config1Id, filename: "AGENTS.md", content: sampleAgentsMd, fileType: "workspace", fileSize: sampleAgentsMd.length },
    { id: generateId(), configId: config1Id, filename: "IDENTITY.md", content: sampleIdentityMd, fileType: "workspace", fileSize: sampleIdentityMd.length },
  ]);
  
  await db.insert(configTags).values([
    { configId: config1Id, tagId: developerTag.id },
    { configId: config1Id, tagId: automationTag.id },
    { configId: config1Id, tagId: advancedTag.id },
  ]);
  
  const config2Id = generateId();
  
  await db.insert(configs).values({
    id: config2Id,
    name: "Developer Power Setup",
    description: "A developer-focused OpenClaw configuration with code review skills, GitHub integration, and CI/CD automation hooks.",
    author: "DevTools Inc",
    authorUrl: "https://example.com/devtools",
    sourceType: "github",
    sourceUrl: "https://github.com/example/developer-config",
    createdAt: new Date(now.getTime() - 86400000 * 3),
    updatedAt: now,
    stars: 128,
    downloads: 542,
    ratingAvg: 4.8,
    ratingCount: 34,
    healthScore: 98,
    isFeatured: true,
  });
  
  await db.insert(files).values([
    { id: generateId(), configId: config2Id, filename: "SOUL.md", content: developerSoul, fileType: "workspace", fileSize: developerSoul.length },
    { id: generateId(), configId: config2Id, filename: "AGENTS.md", content: developerAgents, fileType: "workspace", fileSize: developerAgents.length },
  ]);
  
  await db.insert(configTags).values([
    { configId: config2Id, tagId: developerTag.id },
    { configId: config2Id, tagId: apiTag.id },
    { configId: config2Id, tagId: advancedTag.id },
    { configId: config2Id, tagId: multiAgentTag.id },
  ]);
  
  const config3Id = generateId();
  
  await db.insert(configs).values({
    id: config3Id,
    name: "Discord Community Manager",
    description: "Configure OpenClaw to manage your Discord server. Features include welcome messages, auto-moderation, and member engagement tracking.",
    author: "Discord Bots Co",
    authorUrl: "https://example.com/discordbots",
    sourceType: "community",
    createdAt: new Date(now.getTime() - 86400000 * 7),
    updatedAt: new Date(now.getTime() - 86400000),
    stars: 67,
    downloads: 234,
    ratingAvg: 4.2,
    ratingCount: 18,
    healthScore: 88,
    isFeatured: false,
  });
  
  await db.insert(files).values([
    { id: generateId(), configId: config3Id, filename: "SOUL.md", content: sampleSoulMd, fileType: "workspace", fileSize: sampleSoulMd.length },
    { id: generateId(), configId: config3Id, filename: "AGENTS.md", content: sampleAgentsMd, fileType: "workspace", fileSize: sampleAgentsMd.length },
  ]);
  
  await db.insert(configTags).values([
    { configId: config3Id, tagId: discordTag.id },
    { configId: config3Id, tagId: automationTag.id },
    { configId: config3Id, tagId: beginnerTag.id },
  ]);
  
  console.log("Database seeded successfully!");
  console.log(`Created ${3} configs with files and tags`);
}

seed().catch(console.error);
