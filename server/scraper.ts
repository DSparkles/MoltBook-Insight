import puppeteer from "puppeteer";
import type { ScrapedReply } from "@shared/schema";

interface MoltbookPost {
  title: string;
  author: string;
  content: string;
  replies: ScrapedReply[];
}

export async function scrapePost(postUrl: string): Promise<MoltbookPost> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(postUrl, { 
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector("article, .post, [data-testid]", { timeout: 10000 }).catch(() => {
      console.log("No specific selectors found, will try to extract content anyway");
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const title = await page.$eval("h1", (el) => el.textContent?.trim() || "").catch(() => 
      page.$eval("h2", (el) => el.textContent?.trim() || "").catch(() => "Moltbook Post")
    );

    const content = await page.$$eval("article p, main p", (elements) => 
      elements.slice(0, 3).map((p) => p.textContent?.trim() || "").join(" ")
    ).catch(() => "");

    let replies: Array<{ author: string; content: string; votes: number }> = [];
    
    try {
      replies = await page.$$eval(
        "[class*='reply'], [class*='comment'], [class*='response'], article:not(:first-of-type), .prose",
        (containers) => {
          const results: Array<{ author: string; content: string; votes: number }> = [];
          
          containers.forEach((container) => {
            const replyText = container.textContent?.trim() || "";
            if (replyText.length > 10 && replyText.length < 2000) {
              const authorEl = container.querySelector("[class*='author'], [class*='user'], [class*='name']");
              const replyAuthor = authorEl?.textContent?.trim() || "Anonymous";
              
              const contentEl = container.querySelector("p, [class*='content'], [class*='text']");
              const replyContent = contentEl?.textContent?.trim() || replyText.slice(0, 500);

              if (replyContent.length > 5) {
                results.push({
                  author: replyAuthor.slice(0, 50),
                  content: replyContent,
                  votes: 0,
                });
              }
            }
          });
          
          return results;
        }
      );
    } catch {
      replies = [];
    }

    if (replies.length === 0) {
      try {
        const paragraphs = await page.$$eval("p", (elements) => {
          return elements
            .map((p, index) => ({ text: p.textContent?.trim() || "", index }))
            .filter(({ text, index }) => text.length > 20 && text.length < 1500 && index > 0)
            .map(({ text, index }) => ({
              author: `User${index}`,
              content: text,
              votes: 0,
            }));
        });
        
        if (paragraphs.length > 0) {
          replies.push(...paragraphs);
        }
      } catch {
        // No paragraphs found
      }
    }

    if (replies.length === 0) {
      throw new Error("No replies found on the page. The page structure may have changed or be inaccessible.");
    }

    return {
      title: title || "Moltbook Post",
      author: "Unknown",
      content: content || "Content from Moltbook post",
      replies: replies.slice(0, 50),
    };
  } finally {
    await browser.close();
  }
}
