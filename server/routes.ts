import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { scrapePost } from "./scraper";
import { analyzeReply, analyzePost, calculateAverageScores } from "./analyzer";
import type { ReplyScores } from "@shared/schema";

const createAnalysisSchema = z.object({
  postUrl: z.string().url().refine(
    (url) => url.includes("moltbook.com/post/"),
    { message: "Must be a valid Moltbook post URL" }
  ),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllPostAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const analysis = await storage.getPostAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const replies = await storage.getReplyAnalysesByPost(id);
      res.json({ ...analysis, replies });
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  app.post("/api/analyses", async (req, res) => {
    try {
      const parseResult = createAnalysisSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid Moltbook post URL",
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      const { postUrl } = parseResult.data;

      const analysis = await storage.createPostAnalysis({
        postUrl,
        status: "pending",
      });

      res.status(201).json(analysis);

      processAnalysis(analysis.id, postUrl).catch((error) => {
        console.error("Background analysis failed:", error);
      });
    } catch (error) {
      console.error("Error creating analysis:", error);
      res.status(500).json({ error: "Failed to create analysis" });
    }
  });

  app.delete("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      await storage.deletePostAnalysis(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  app.get("/api/overall-stats", async (req, res) => {
    try {
      const stats = await storage.getOverallStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching overall stats:", error);
      res.status(500).json({ error: "Failed to fetch overall stats" });
    }
  });

  return httpServer;
}

async function processAnalysis(analysisId: number, postUrl: string): Promise<void> {
  try {
    await storage.updatePostAnalysis(analysisId, { status: "analyzing" });

    const postData = await scrapePost(postUrl);

    await storage.updatePostAnalysis(analysisId, {
      postTitle: postData.title,
      postAuthor: postData.author,
      postContent: postData.content.slice(0, 5000),
      totalReplies: postData.replies.length,
    });

    // Analyze the original post intent
    try {
      const postAnalysisResult = await analyzePost(
        postData.title,
        postData.content,
        postData.author
      );
      await storage.updatePostAnalysis(analysisId, {
        postIntent: postAnalysisResult.intent,
        postScores: postAnalysisResult.scores,
        postIntentReasoning: postAnalysisResult.reasoning,
      });
    } catch (error) {
      console.error("Error analyzing post intent:", error);
    }

    let cohesiveCount = 0;
    let spamCount = 0;
    const allScores: ReplyScores[] = [];

    const maxReplies = Math.min(postData.replies.length, 50);

    for (let i = 0; i < maxReplies; i++) {
      const reply = postData.replies[i];
      try {
        const result = await analyzeReply(reply);

        await storage.createReplyAnalysis({
          postAnalysisId: analysisId,
          author: reply.author,
          content: reply.content.slice(0, 5000),
          category: result.category,
          scores: result.scores,
          reasoning: result.reasoning,
        });

        allScores.push(result.scores);

        if (result.category === "cohesive_helpful") {
          cohesiveCount++;
        } else {
          spamCount++;
        }

        if (i % 5 === 0) {
          await storage.updatePostAnalysis(analysisId, {
            cohesiveCount,
            spamCount,
            averageScores: calculateAverageScores(allScores),
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error analyzing reply ${i}:`, error);
      }
    }

    await storage.updatePostAnalysis(analysisId, {
      status: "completed",
      cohesiveCount,
      spamCount,
      averageScores: calculateAverageScores(allScores),
      completedAt: new Date(),
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    await storage.updatePostAnalysis(analysisId, {
      status: "failed",
    });
  }
}
