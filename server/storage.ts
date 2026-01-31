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

export interface OverallStats {
  totalAnalyses: number;
  totalReplies: number;
  totalCohesive: number;
  totalSpam: number;
  averageScores: ReplyScores | null;
}

export interface IStorage {
  createPostAnalysis(data: InsertPostAnalysis): Promise<PostAnalysis>;
  getPostAnalysis(id: number): Promise<PostAnalysis | undefined>;
  getAllPostAnalyses(): Promise<PostAnalysis[]>;
  updatePostAnalysis(id: number, data: Partial<InsertPostAnalysis>): Promise<PostAnalysis | undefined>;
  deletePostAnalysis(id: number): Promise<void>;
  getOverallStats(): Promise<OverallStats>;

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

  async getOverallStats(): Promise<OverallStats> {
    const completedAnalyses = await db
      .select()
      .from(postAnalyses)
      .where(eq(postAnalyses.status, "completed"));

    if (completedAnalyses.length === 0) {
      return {
        totalAnalyses: 0,
        totalReplies: 0,
        totalCohesive: 0,
        totalSpam: 0,
        averageScores: null,
      };
    }

    let totalReplies = 0;
    let totalCohesive = 0;
    let totalSpam = 0;
    
    const scoreSums = {
      cooperativeIntent: 0,
      communicationClarity: 0,
      knowledgeSharing: 0,
      ethicalConsideration: 0,
      humanAlignment: 0,
    };
    let scoreCount = 0;

    for (const analysis of completedAnalyses) {
      totalReplies += analysis.totalReplies || 0;
      totalCohesive += analysis.cohesiveCount || 0;
      totalSpam += analysis.spamCount || 0;

      if (analysis.averageScores) {
        const scores = analysis.averageScores as ReplyScores;
        scoreSums.cooperativeIntent += scores.cooperativeIntent;
        scoreSums.communicationClarity += scores.communicationClarity;
        scoreSums.knowledgeSharing += scores.knowledgeSharing;
        scoreSums.ethicalConsideration += scores.ethicalConsideration;
        scoreSums.humanAlignment += scores.humanAlignment;
        scoreCount++;
      }
    }

    const averageScores: ReplyScores | null = scoreCount > 0
      ? {
          cooperativeIntent: Math.round((scoreSums.cooperativeIntent / scoreCount) * 10) / 10,
          communicationClarity: Math.round((scoreSums.communicationClarity / scoreCount) * 10) / 10,
          knowledgeSharing: Math.round((scoreSums.knowledgeSharing / scoreCount) * 10) / 10,
          ethicalConsideration: Math.round((scoreSums.ethicalConsideration / scoreCount) * 10) / 10,
          humanAlignment: Math.round((scoreSums.humanAlignment / scoreCount) * 10) / 10,
        }
      : null;

    return {
      totalAnalyses: completedAnalyses.length,
      totalReplies,
      totalCohesive,
      totalSpam,
      averageScores,
    };
  }
}

export const storage = new DatabaseStorage();
