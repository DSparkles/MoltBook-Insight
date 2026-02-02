import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Reply evaluation scores (1-7 Likert scale)
export const replyScoresSchema = z.object({
  cooperativeIntent: z.number().min(1).max(7),
  communicationClarity: z.number().min(1).max(7),
  knowledgeSharing: z.number().min(1).max(7),
  ethicalConsideration: z.number().min(1).max(7),
  humanAlignment: z.number().min(1).max(7),
});

export type ReplyScores = z.infer<typeof replyScoresSchema>;

// Category enum
export const categoryEnum = z.enum(["cohesive_helpful", "argumentative_spam"]);
export type Category = z.infer<typeof categoryEnum>;

// Reply motivation enum
export const replyMotivationEnum = z.enum([
  "agreement",       // Agreeing, supporting, endorsing
  "curiosity",       // Asking questions, seeking clarification
  "criticism",       // Disagreeing, critiquing, challenging
  "promotion",       // Self-promotion, advertising, marketing
  "humor",           // Jokes, entertainment, light-hearted
  "trolling",        // Provocation, disruption, bad faith
  "community",       // Building connections, welcoming, inclusive
  "information",     // Sharing facts, resources, knowledge
]);
export type ReplyMotivation = z.infer<typeof replyMotivationEnum>;

// Scraped reply data
export const scrapedReplySchema = z.object({
  author: z.string(),
  content: z.string(),
  timestamp: z.string().optional(),
  votes: z.number().optional(),
});

export type ScrapedReply = z.infer<typeof scrapedReplySchema>;

// Post intent categories
export const postIntentEnum = z.enum([
  "informative",      // Sharing news, information, updates
  "discussion",       // Inviting conversation/debate
  "question",         // Asking for help/answers
  "announcement",     // Making announcements
  "promotional",      // Self-promotion, marketing
  "provocative",      // Controversial, attention-seeking
  "collaborative"     // Seeking collaboration/partnership
]);
export type PostIntent = z.infer<typeof postIntentEnum>;

// Post analysis table
export const postAnalyses = pgTable("post_analyses", {
  id: serial("id").primaryKey(),
  postUrl: text("post_url").notNull(),
  postTitle: text("post_title"),
  postAuthor: text("post_author"),
  postContent: text("post_content"),
  totalReplies: integer("total_replies").default(0),
  cohesiveCount: integer("cohesive_count").default(0),
  spamCount: integer("spam_count").default(0),
  averageScores: jsonb("average_scores").$type<ReplyScores>(),
  postIntent: text("post_intent"),
  postScores: jsonb("post_scores").$type<ReplyScores>(),
  postIntentReasoning: text("post_intent_reasoning"),
  status: text("status").notNull().default("pending"), // pending, analyzing, completed, failed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertPostAnalysisSchema = createInsertSchema(postAnalyses).omit({
  id: true,
  createdAt: true,
}).extend({
  completedAt: z.date().optional().nullable(),
});

export type PostAnalysis = typeof postAnalyses.$inferSelect;
export type InsertPostAnalysis = z.infer<typeof insertPostAnalysisSchema>;

// Reply analysis table
export const replyAnalyses = pgTable("reply_analyses", {
  id: serial("id").primaryKey(),
  postAnalysisId: integer("post_analysis_id").notNull().references(() => postAnalyses.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // cohesive_helpful or argumentative_spam
  motivation: text("motivation"), // reply motivation type
  scores: jsonb("scores").$type<ReplyScores>().notNull(),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertReplyAnalysisSchema = createInsertSchema(replyAnalyses).omit({
  id: true,
  createdAt: true,
});

export type ReplyAnalysis = typeof replyAnalyses.$inferSelect;
export type InsertReplyAnalysis = z.infer<typeof insertReplyAnalysisSchema>;
