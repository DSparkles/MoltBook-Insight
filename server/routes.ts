import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { scrapePost } from "./scraper";
import { analyzeReply, analyzePost, calculateAverageScores, generateOptimization } from "./analyzer";
import type { ReplyScores } from "@shared/schema";
import fs from "fs";
import path from "path";

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
  app.get("/api/health", async (req, res) => {
    try {
      const stats = await storage.getOverallStats();
      res.json({
        status: "ok",
        database: "connected",
        totalAnalyses: stats.totalAnalyses,
        environment: process.env.NODE_ENV || "unknown",
        hasDbUrl: !!process.env.DATABASE_URL,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        database: "disconnected",
        error: (error as Error).message,
        environment: process.env.NODE_ENV || "unknown",
        hasDbUrl: !!process.env.DATABASE_URL,
      });
    }
  });

  app.post("/api/seed", async (req, res) => {
    try {
      const stats = await storage.getOverallStats();
      if (stats.totalAnalyses > 0) {
        return res.json({ 
          message: "Database already has data", 
          totalAnalyses: stats.totalAnalyses 
        });
      }

      const seedPath = path.join(process.cwd(), "server", "seed-data", "analyses.json");
      if (!fs.existsSync(seedPath)) {
        return res.status(404).json({ error: "Seed file not found" });
      }

      const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
      let seeded = 0;

      for (const analysis of seedData) {
        await storage.createPostAnalysis({
          postUrl: analysis.postUrl,
          postTitle: analysis.postTitle,
          postAuthor: analysis.postAuthor,
          postContent: analysis.postContent,
          totalReplies: analysis.totalReplies,
          cohesiveCount: analysis.cohesiveCount,
          spamCount: analysis.spamCount,
          averageScores: analysis.averageScores,
          status: analysis.status,
          postIntent: analysis.postIntent || null,
        });
        seeded++;
      }

      res.json({ 
        message: "Database seeded successfully", 
        seededCount: seeded 
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

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

  app.get("/api/export-all", async (req, res) => {
    try {
      const analyses = await storage.getAllPostAnalyses();
      const csvRows: string[] = [];

      const esc = (v: string) => `"${(v || "").replace(/"/g, '""').replace(/[\n\r]+/g, " ")}"`;

      csvRows.push([
        "Post ID", "Post URL", "Post Title", "Post Author", "Post Intent", "Post Intent Reasoning",
        "Status", "Total Replies", "Cohesive Count", "Spam Count",
        "Post Cooperative Intent", "Post Clarity", "Post Knowledge Sharing", "Post Ethics", "Post Human Alignment",
        "Avg Cooperative Intent", "Avg Clarity", "Avg Knowledge Sharing", "Avg Ethics", "Avg Human Alignment",
        "Reply Author", "Reply Category", "Reply Motivation",
        "Reply Cooperative Intent", "Reply Clarity", "Reply Knowledge Sharing", "Reply Ethics", "Reply Human Alignment",
        "Reply Reasoning", "Reply Content"
      ].join(","));

      for (const analysis of analyses) {
        const replies = await storage.getReplyAnalysesByPost(analysis.id);
        const ps = analysis.postScores;
        const as_ = analysis.averageScores;

        if (replies.length === 0) {
          csvRows.push([
            analysis.id,
            esc(analysis.postUrl),
            esc(analysis.postTitle || ""),
            esc(analysis.postAuthor || ""),
            esc(analysis.postIntent || ""),
            esc(analysis.postIntentReasoning || ""),
            analysis.status,
            analysis.totalReplies ?? 0,
            analysis.cohesiveCount ?? 0,
            analysis.spamCount ?? 0,
            ps?.cooperativeIntent ?? "", ps?.communicationClarity ?? "", ps?.knowledgeSharing ?? "", ps?.ethicalConsideration ?? "", ps?.humanAlignment ?? "",
            as_?.cooperativeIntent ?? "", as_?.communicationClarity ?? "", as_?.knowledgeSharing ?? "", as_?.ethicalConsideration ?? "", as_?.humanAlignment ?? "",
            "", "", "", "", "", "", "", "", "", ""
          ].join(","));
        } else {
          for (const reply of replies) {
            csvRows.push([
              analysis.id,
              esc(analysis.postUrl),
              esc(analysis.postTitle || ""),
              esc(analysis.postAuthor || ""),
              esc(analysis.postIntent || ""),
              esc(analysis.postIntentReasoning || ""),
              analysis.status,
              analysis.totalReplies ?? 0,
              analysis.cohesiveCount ?? 0,
              analysis.spamCount ?? 0,
              ps?.cooperativeIntent ?? "", ps?.communicationClarity ?? "", ps?.knowledgeSharing ?? "", ps?.ethicalConsideration ?? "", ps?.humanAlignment ?? "",
              as_?.cooperativeIntent ?? "", as_?.communicationClarity ?? "", as_?.knowledgeSharing ?? "", as_?.ethicalConsideration ?? "", as_?.humanAlignment ?? "",
              esc(reply.author),
              reply.category === "cohesive_helpful" ? "Cohesive & Helpful" : "Argumentative & Spam",
              reply.motivation || "",
              reply.scores.cooperativeIntent,
              reply.scores.communicationClarity,
              reply.scores.knowledgeSharing,
              reply.scores.ethicalConsideration,
              reply.scores.humanAlignment,
              esc(reply.reasoning || ""),
              esc(reply.content.slice(0, 500))
            ].join(","));
          }
        }
      }

      const csv = "\uFEFF" + csvRows.join("\r\n");
      res.status(200);
      res.type("text/csv; charset=utf-8");
      res.set("Content-Disposition", "attachment; filename=moltbook-full-export.csv");
      res.set("Cache-Control", "no-cache");
      res.end(csv);
    } catch (error) {
      console.error("Error exporting all data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.post("/api/analyses/:id/optimize", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const { agentName } = req.body;
      if (!agentName || typeof agentName !== "string") {
        return res.status(400).json({ error: "Agent name is required" });
      }

      const analysis = await storage.getPostAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const replies = await storage.getReplyAnalysesByPost(id);
      const agentReplies = replies.filter(
        (r) => r.author.toLowerCase() === agentName.toLowerCase()
      );

      if (agentReplies.length === 0) {
        return res.status(404).json({ error: `No replies found for agent "${agentName}"` });
      }

      const avgScores: ReplyScores = {
        cooperativeIntent: 0,
        communicationClarity: 0,
        knowledgeSharing: 0,
        ethicalConsideration: 0,
        humanAlignment: 0,
      };

      for (const r of agentReplies) {
        avgScores.cooperativeIntent += r.scores.cooperativeIntent;
        avgScores.communicationClarity += r.scores.communicationClarity;
        avgScores.knowledgeSharing += r.scores.knowledgeSharing;
        avgScores.ethicalConsideration += r.scores.ethicalConsideration;
        avgScores.humanAlignment += r.scores.humanAlignment;
      }

      const count = agentReplies.length;
      (Object.keys(avgScores) as (keyof ReplyScores)[]).forEach((k) => {
        avgScores[k] = Math.round((avgScores[k] / count) * 10) / 10;
      });

      const quickWins = await generateOptimization(
        agentName,
        agentReplies.map((r) => ({ content: r.content, scores: r.scores }))
      );

      res.json({
        agentName,
        baselineScores: avgScores,
        quickWins,
        totalRepliesAnalyzed: agentReplies.length,
      });
    } catch (error) {
      console.error("Error generating optimization:", error);
      res.status(500).json({ error: "Failed to generate optimization" });
    }
  });

  app.get("/api/analyses/:id/export", async (req, res) => {
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

      const csvRows: string[] = [];
      
      csvRows.push("Moltbook Analysis Export");
      csvRows.push(`Post URL,${analysis.postUrl}`);
      csvRows.push(`Post Title,${(analysis.postTitle || "").replace(/,/g, ";")}`);
      csvRows.push(`Post Author,${analysis.postAuthor || ""}`);
      csvRows.push(`Post Intent,${analysis.postIntent || ""}`);
      csvRows.push(`Status,${analysis.status}`);
      csvRows.push(`Total Replies,${analysis.totalReplies}`);
      csvRows.push(`Cohesive Count,${analysis.cohesiveCount}`);
      csvRows.push(`Spam Count,${analysis.spamCount}`);
      csvRows.push("");
      
      if (analysis.postScores) {
        csvRows.push("Post Quality Scores");
        csvRows.push(`Cooperative Intent,${analysis.postScores.cooperativeIntent}`);
        csvRows.push(`Communication Clarity,${analysis.postScores.communicationClarity}`);
        csvRows.push(`Knowledge Sharing,${analysis.postScores.knowledgeSharing}`);
        csvRows.push(`Ethical Consideration,${analysis.postScores.ethicalConsideration}`);
        csvRows.push(`Human Alignment,${analysis.postScores.humanAlignment}`);
        csvRows.push("");
      }
      
      if (analysis.averageScores) {
        csvRows.push("Average Reply Scores");
        csvRows.push(`Cooperative Intent,${analysis.averageScores.cooperativeIntent}`);
        csvRows.push(`Communication Clarity,${analysis.averageScores.communicationClarity}`);
        csvRows.push(`Knowledge Sharing,${analysis.averageScores.knowledgeSharing}`);
        csvRows.push(`Ethical Consideration,${analysis.averageScores.ethicalConsideration}`);
        csvRows.push(`Human Alignment,${analysis.averageScores.humanAlignment}`);
        csvRows.push("");
      }

      csvRows.push("Reply Analysis");
      csvRows.push("Author,Category,Motivation,Cooperative Intent,Clarity,Knowledge Sharing,Ethics,Human Alignment,Reasoning,Content");
      
      for (const reply of replies) {
        const content = reply.content.replace(/[\n\r]/g, " ").replace(/,/g, ";").slice(0, 200);
        const reasoning = (reply.reasoning || "").replace(/[\n\r]/g, " ").replace(/,/g, ";");
        csvRows.push([
          reply.author,
          reply.category === "cohesive_helpful" ? "Cohesive & Helpful" : "Argumentative & Spam",
          reply.motivation || "N/A",
          reply.scores.cooperativeIntent,
          reply.scores.communicationClarity,
          reply.scores.knowledgeSharing,
          reply.scores.ethicalConsideration,
          reply.scores.humanAlignment,
          reasoning,
          content,
        ].join(","));
      }

      const csv = csvRows.join("\n");
      const filename = `moltbook-analysis-${id}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting analysis:", error);
      res.status(500).json({ error: "Failed to export analysis" });
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

    // Analyze the original post intent with retry
    let postIntentSuccess = false;
    for (let attempt = 0; attempt < 3 && !postIntentSuccess; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
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
        postIntentSuccess = true;
        console.log(`Post intent analysis completed: ${postAnalysisResult.intent}`);
      } catch (error) {
        console.error(`Error analyzing post intent (attempt ${attempt + 1}/3):`, error);
      }
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
          motivation: result.motivation,
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
