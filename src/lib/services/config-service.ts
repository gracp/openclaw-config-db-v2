import { db, configs, files, tags, configTags } from "$lib/db";
import { eq, like, or, desc, sql, inArray } from "drizzle-orm";
import { generateId } from "$lib/utils/nanoid";
import { autoClassify, classifyFileType } from "$lib/utils/classifier";

interface ConfigFilters {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  sourceType?: "github" | "upload" | "community";
  sortBy?: "stars" | "downloads" | "created";
}

interface ConfigWithFiles {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  authorUrl: string | null;
  sourceUrl: string | null;
  sourceType: "github" | "upload" | "community";
  createdAt: Date;
  updatedAt: Date;
  stars: number;
  downloads: number;
  ratingAvg: number;
  ratingCount: number;
  healthScore: number | null;
  isFeatured: boolean;
  files: Array<{
    id: string;
    filename: string;
    content: string;
    fileType: "workspace" | "config" | "skill" | "readme" | "other";
    fileSize: number;
  }>;
  tags: string[];
}

export async function getAllConfigs(filters: ConfigFilters = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    tag,
    sourceType,
    sortBy = "created",
  } = filters;

  const offset = (page - 1) * limit;

  let query = db.select().from(configs);
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(configs);

  if (search) {
    const searchPattern = `%${search}%`;
    query = query.where(
      or(
        like(configs.name, searchPattern),
        like(configs.description, searchPattern)
      )
    ) as typeof query;
  }

  if (sourceType) {
    query = query.where(eq(configs.sourceType, sourceType)) as typeof query;
  }

  if (tag) {
    const tagRecord = await db.select().from(tags).where(like(tags.name, `%${tag}%`)).limit(1);
    if (tagRecord.length > 0) {
      const configIdsWithTag = await db
        .select({ configId: configTags.configId })
        .from(configTags)
        .where(eq(configTags.tagId, tagRecord[0].id));
      const ids = configIdsWithTag.map(c => c.configId);
      if (ids.length > 0) {
        query = query.where(inArray(configs.id, ids)) as typeof query;
      }
    }
  }

  switch (sortBy) {
    case "stars":
      query = query.orderBy(desc(configs.stars)) as typeof query;
      break;
    case "downloads":
      query = query.orderBy(desc(configs.downloads)) as typeof query;
      break;
    case "created":
    default:
      query = query.orderBy(desc(configs.createdAt)) as typeof query;
  }

  query = query.limit(limit).offset(offset) as typeof query;

  const results = await query;

  const configsWithTags = await Promise.all(
    results.map(async (config) => {
      const configTagRecords = await db
        .select({ tagName: tags.name })
        .from(configTags)
        .innerJoin(tags, eq(configTags.tagId, tags.id))
        .where(eq(configTags.configId, config.id));

      return {
        ...config,
        tags: configTagRecords.map(t => t.tagName),
      };
    })
  );

  return {
    configs: configsWithTags,
    page,
    limit,
    total: results.length,
  };
}

export async function getConfigById(id: string): Promise<ConfigWithFiles | null> {
  const configResults = await db.select().from(configs).where(eq(configs.id, id));

  if (configResults.length === 0) {
    return null;
  }

  const config = configResults[0];

  const fileResults = await db
    .select({
      id: files.id,
      filename: files.filename,
      content: files.content,
      fileType: files.fileType,
      fileSize: files.fileSize,
    })
    .from(files)
    .where(eq(files.configId, id));

  const tagResults = await db
    .select({ name: tags.name })
    .from(configTags)
    .innerJoin(tags, eq(configTags.tagId, tags.id))
    .where(eq(configTags.configId, id));

  return {
    ...config,
    files: fileResults,
    tags: tagResults.map(t => t.name),
  };
}

export async function getConfigFile(configId: string, filename: string) {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (filename !== sanitized || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return null;
  }

  const fileResults = await db
    .select()
    .from(files)
    .where(eq(files.configId, configId))
    .limit(1);

  const file = fileResults.find(f => f.filename === filename);

  if (!file) {
    return null;
  }

  return file;
}

interface CreateConfigData {
  name: string;
  description?: string;
  author?: string;
  authorUrl?: string;
  sourceType?: "github" | "upload" | "community";
  sourceUrl?: string;
}

interface CreateConfigResult {
  id: string;
  suggestedTags: string[];
}

export async function createConfig(
  data: CreateConfigData,
  filesData: Array<{ filename: string; content: string }>
): Promise<CreateConfigResult> {
  const configId = generateId();
  const now = new Date();

  const allContent = filesData.map(f => `${f.filename}\n${f.content}`).join("\n\n");
  const classification = autoClassify(allContent);

  await db.insert(configs).values({
    id: configId,
    name: data.name,
    description: data.description || null,
    author: data.author || null,
    authorUrl: data.authorUrl || null,
    sourceUrl: data.sourceUrl || null,
    sourceType: data.sourceType || "upload",
    createdAt: now,
    updatedAt: now,
    stars: 0,
    downloads: 0,
    ratingAvg: 0,
    ratingCount: 0,
    healthScore: null,
    isFeatured: false,
  });

  for (const file of filesData) {
    const fileType = classifyFileType(file.filename, file.content);
    await db.insert(files).values({
      id: generateId(),
      configId,
      filename: file.filename,
      content: file.content,
      fileType,
      fileSize: file.content.length,
    });
  }

  for (const tagName of classification.suggestedTags) {
    const existingTag = await db.select().from(tags).where(like(tags.name, tagName)).limit(1);

    let tagId: string;
    if (existingTag.length > 0) {
      tagId = existingTag[0].id;
    } else {
      tagId = generateId();
      await db.insert(tags).values({
        id: tagId,
        name: tagName,
        category: "use_case" as const,
      });
    }

    await db.insert(configTags).values({
      configId,
      tagId,
    });
  }

  return {
    id: configId,
    suggestedTags: classification.suggestedTags,
  };
}

export async function incrementDownloads(id: string) {
  await db
    .update(configs)
    .set({ downloads: sql`${configs.downloads} + 1` })
    .where(eq(configs.id, id));
}

export async function searchConfigs(query: string) {
  const searchPattern = `%${query}%`;

  const matchingConfigs = await db
    .select()
    .from(configs)
    .where(
      or(
        like(configs.name, searchPattern),
        like(configs.description, searchPattern)
      )
    );

  const matchingFiles = await db
    .select({
      configId: files.configId,
    })
    .from(files)
    .where(like(files.content, searchPattern))
    .groupBy(files.configId);

  const configIdsFromFiles = matchingFiles.map(f => f.configId);
  const configIdsFromConfigs = matchingConfigs.map(c => c.id);

  const allConfigIds = [...new Set([...configIdsFromConfigs, ...configIdsFromFiles])];

  if (allConfigIds.length === 0) {
    return [];
  }

  const results = await db
    .select()
    .from(configs)
    .where(inArray(configs.id, allConfigIds));

  return results;
}

export async function getAllTags() {
  const allTags = await db.select().from(tags);

  const grouped: Record<string, string[]> = {
    use_case: [],
    complexity: [],
    platform: [],
    persona: [],
    channel: [],
  };

  for (const tag of allTags) {
    if (grouped[tag.category]) {
      grouped[tag.category].push(tag.name);
    }
  }

  return grouped;
}
