import { db } from "./db";
import {
  postAnalyses,
  replyAnalyses,
  type PostAnalysis,
  type InsertPostAnalysis,
  type ReplyAnalysis,
  type InsertReplyAnalysis,
  type ReplyScores,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createPostAnalysis(data: InsertPostAnalysis): Promise<PostAnalysis>;
  getPostAnalysis(id: number): Promise<PostAnalysis | undefined>;
  getAllPostAnalyses(): Promise<PostAnalysis[]>;
  updatePostAnalysis(id: number, data: Partial<InsertPostAnalysis>): Promise<PostAnalysis | undefined>;
  deletePostAnalysis(id: number): Promise<void>;

  createReplyAnalysis(data: InsertReplyAnalysis): Promise<ReplyAnalysis>;
  getReplyAnalysesByPost(postAnalysisId: number): Promise<ReplyAnalysis[]>;
  getReplyAnalysisCount(postAnalysisId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async createPostAnalysis(data: InsertPostAnalysis): Promise<PostAnalysis> {
    const [result] = await db.insert(postAnalyses).values(data).returning();
    return result;
  }

  async getPostAnalysis(id: number): Promise<PostAnalysis | undefined> {
    const [result] = await db.select().from(postAnalyses).where(eq(postAnalyses.id, id));
    return result;
  }

  async getAllPostAnalyses(): Promise<PostAnalysis[]> {
    return db.select().from(postAnalyses).orderBy(desc(postAnalyses.createdAt));
  }

  async updatePostAnalysis(id: number, data: Partial<InsertPostAnalysis>): Promise<PostAnalysis | undefined> {
    const [result] = await db.update(postAnalyses).set(data).where(eq(postAnalyses.id, id)).returning();
    return result;
  }

  async deletePostAnalysis(id: number): Promise<void> {
    await db.delete(replyAnalyses).where(eq(replyAnalyses.postAnalysisId, id));
    await db.delete(postAnalyses).where(eq(postAnalyses.id, id));
  }

  async createReplyAnalysis(data: InsertReplyAnalysis): Promise<ReplyAnalysis> {
    const [result] = await db.insert(replyAnalyses).values(data).returning();
    return result;
  }

  async getReplyAnalysesByPost(postAnalysisId: number): Promise<ReplyAnalysis[]> {
    return db.select().from(replyAnalyses).where(eq(replyAnalyses.postAnalysisId, postAnalysisId));
  }

  async getReplyAnalysisCount(postAnalysisId: number): Promise<number> {
    const results = await db.select().from(replyAnalyses).where(eq(replyAnalyses.postAnalysisId, postAnalysisId));
    return results.length;
  }
}

export const storage = new DatabaseStorage();
