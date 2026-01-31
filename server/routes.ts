import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { scrapePost, scrapeFeed } from "./scraper";
import { analyzeReply, analyzePost, calculateAverageScores } from "./analyzer";
import type { ReplyScores, AnalyzeSession } from "@shared/schema";

const createAnalysisSchema = z.object({
  postUrl: z.string().url().refine(
    (url) => url.includes("moltbook.com/post/"),
    { message: "Must be a valid Moltbook post URL" }
  ),
});

// Track analyzed URLs per session to avoid duplicates
const sessionAnalyzedUrls = new Map<number, Set<string>>();
// Track which sessions are currently fetching to prevent concurrent runs
const sessionFetchLocks = new Set<number>();

// Cleanup function to remove tracking data for a session
function cleanupSession(sessionId: number): void {
  sessionAnalyzedUrls.delete(sessionId);
  sessionFetchLocks.delete(sessionId);
}

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
      csvRows.push("Author,Category,Cooperative Intent,Clarity,Knowledge Sharing,Ethics,Human Alignment,Reasoning,Content");
      
      for (const reply of replies) {
        const content = reply.content.replace(/[\n\r]/g, " ").replace(/,/g, ";").slice(0, 200);
        const reasoning = (reply.reasoning || "").replace(/[\n\r]/g, " ").replace(/,/g, ";");
        csvRows.push([
          reply.author,
          reply.category === "cohesive_helpful" ? "Cohesive & Helpful" : "Argumentative & Spam",
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

  // Analyze Sessions API
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllAnalyzeSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/active", async (req, res) => {
    try {
      const session = await storage.getActiveSession();
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching active session:", error);
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      const session = await storage.getAnalyzeSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions/start", async (req, res) => {
    try {
      // Check if there's already an active session
      const activeSession = await storage.getActiveSession();
      if (activeSession) {
        return res.status(400).json({ error: "An analyze session is already active" });
      }

      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const nextFetchAt = now; // Start immediately

      const session = await storage.createAnalyzeSession({
        name: `Session ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        status: "active",
        endsAt,
        nextFetchAt,
        fetchCount: 0,
        totalPostsAnalyzed: 0,
        totalReplies: 0,
        cohesiveCount: 0,
        spamCount: 0,
      });

      res.status(201).json(session);

      // Trigger the first fetch immediately
      processSessionFetch(session.id).catch(console.error);
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  app.post("/api/sessions/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      const session = await storage.stopAnalyzeSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      // Cleanup session tracking data
      cleanupSession(id);
      res.json(session);
    } catch (error) {
      console.error("Error stopping session:", error);
      res.status(500).json({ error: "Failed to stop session" });
    }
  });

  // Background job: check for sessions due for fetch every minute
  setInterval(async () => {
    try {
      const sessions = await storage.getSessionsDueForFetch();
      for (const session of sessions) {
        // Check if session has ended
        if (new Date() >= new Date(session.endsAt)) {
          await storage.updateAnalyzeSession(session.id, {
            status: "completed",
            completedAt: new Date(),
          });
          // Cleanup session tracking data
          cleanupSession(session.id);
          console.log(`Session ${session.id} completed (30 minutes elapsed)`);
          continue;
        }

        processSessionFetch(session.id).catch(console.error);
      }
    } catch (error) {
      console.error("Error in session background job:", error);
    }
  }, 60 * 1000); // Check every minute

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

async function processSessionFetch(sessionId: number): Promise<void> {
  // Prevent concurrent fetches for the same session
  if (sessionFetchLocks.has(sessionId)) {
    console.log(`Session ${sessionId}: Fetch already in progress, skipping`);
    return;
  }

  try {
    sessionFetchLocks.add(sessionId);

    const session = await storage.getAnalyzeSession(sessionId);
    if (!session || session.status !== "active") {
      cleanupSession(sessionId);
      return;
    }

    console.log(`Session ${sessionId}: Starting fetch #${(session.fetchCount || 0) + 1}`);

    // Initialize URL tracking for this session
    if (!sessionAnalyzedUrls.has(sessionId)) {
      sessionAnalyzedUrls.set(sessionId, new Set());
    }
    const analyzedUrls = sessionAnalyzedUrls.get(sessionId)!;

    // Fetch posts from feed
    const feedPosts = await scrapeFeed();
    
    // Filter out already analyzed posts
    const newPosts = feedPosts.filter(p => !analyzedUrls.has(p.url));
    
    console.log(`Session ${sessionId}: Found ${newPosts.length} new posts to analyze`);

    let totalNewReplies = 0;
    let newCohesive = 0;
    let newSpam = 0;

    // Analyze up to 3 new posts per fetch to stay within rate limits
    const postsToAnalyze = newPosts.slice(0, 3);
    
    for (const feedPost of postsToAnalyze) {
      try {
        analyzedUrls.add(feedPost.url);

        // Create analysis record
        const analysis = await storage.createPostAnalysis({
          postUrl: feedPost.url,
          status: "pending",
        });

        // Process the analysis (reuse existing logic)
        await processAnalysis(analysis.id, feedPost.url);

        // Get the completed analysis to update session stats
        const completedAnalysis = await storage.getPostAnalysis(analysis.id);
        if (completedAnalysis && completedAnalysis.status === "completed") {
          totalNewReplies += completedAnalysis.totalReplies || 0;
          newCohesive += completedAnalysis.cohesiveCount || 0;
          newSpam += completedAnalysis.spamCount || 0;
        }
      } catch (error) {
        console.error(`Session ${sessionId}: Error analyzing ${feedPost.url}:`, error);
      }
    }

    // Update session stats
    const updatedSession = await storage.getAnalyzeSession(sessionId);
    if (updatedSession) {
      const newFetchCount = (updatedSession.fetchCount || 0) + 1;
      const nextFetchTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      await storage.updateAnalyzeSession(sessionId, {
        fetchCount: newFetchCount,
        totalPostsAnalyzed: (updatedSession.totalPostsAnalyzed || 0) + postsToAnalyze.length,
        totalReplies: (updatedSession.totalReplies || 0) + totalNewReplies,
        cohesiveCount: (updatedSession.cohesiveCount || 0) + newCohesive,
        spamCount: (updatedSession.spamCount || 0) + newSpam,
        nextFetchAt: nextFetchTime,
      });

      console.log(`Session ${sessionId}: Fetch #${newFetchCount} complete. Next fetch at ${nextFetchTime.toLocaleTimeString()}`);
    }
  } catch (error) {
    console.error(`Session ${sessionId}: Fetch failed:`, error);
    
    // Still schedule the next fetch on error
    const session = await storage.getAnalyzeSession(sessionId);
    if (session && session.status === "active") {
      await storage.updateAnalyzeSession(sessionId, {
        nextFetchAt: new Date(Date.now() + 5 * 60 * 1000),
      });
    }
  } finally {
    // Always release the lock
    sessionFetchLocks.delete(sessionId);
  }
}
