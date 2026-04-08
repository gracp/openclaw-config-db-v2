import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const configs = sqliteTable("configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  author: text("author"),
  authorUrl: text("author_url"),
  sourceUrl: text("source_url"),
  sourceType: text("source_type", { enum: ["github", "upload", "community"] }).notNull().default("community"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  stars: integer("stars").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  ratingAvg: real("rating_avg").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  healthScore: integer("health_score"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  configId: text("config_id").notNull().references(() => configs.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type", { enum: ["workspace", "config", "skill", "readme", "other"] }).notNull().default("other"),
  fileSize: integer("file_size").notNull().default(0),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category", { enum: ["use_case", "complexity", "platform", "persona", "channel"] }).notNull(),
});

export const configTags = sqliteTable("config_tags", {
  configId: text("config_id").notNull().references(() => configs.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export type Config = typeof configs.$inferSelect;
export type NewConfig = typeof configs.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
