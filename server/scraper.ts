import puppeteer from "puppeteer";
import type { ScrapedReply } from "@shared/schema";

interface MoltbookPost {
  title: string;
  author: string;
  content: string;
  replies: ScrapedReply[];
}

interface FeedPost {
  url: string;
  title: string;
  author: string;
}

export async function scrapeFeed(): Promise<FeedPost[]> {
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

    console.log("Scraping Moltbook feed...");
    
    await page.goto("https://www.moltbook.com/m", { 
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const posts = await page.evaluate(() => {
      const results: { url: string; title: string; author: string }[] = [];
      
      const links = document.querySelectorAll('a[href*="/post/"]');
      
      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        if (href && href.includes("/post/") && !results.some(p => p.url === href)) {
          const container = link.closest("div");
          const title = link.textContent?.trim() || "Moltbook Post";
          const imgEl = container?.querySelector("img[alt]") as HTMLImageElement;
          const author = imgEl?.alt || "Unknown";
          
          results.push({
            url: href,
            title: title.slice(0, 200),
            author: author.slice(0, 50),
          });
        }
      });
      
      return results.slice(0, 10);
    });

    console.log(`Found ${posts.length} posts in feed`);
    return posts;
  } finally {
    await browser.close();
  }
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

    console.log(`Scraping: ${postUrl}`);
    
    await page.goto(postUrl, { 
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const title = await page.$eval("h1", (el) => el.textContent?.trim() || "").catch(() => 
      page.$eval("h2", (el) => el.textContent?.trim() || "").catch(() => "Moltbook Post")
    );

    console.log(`Found title: ${title}`);

    const content = await page.evaluate(() => {
      const mainContent = document.querySelector("main, article, .post, .content");
      if (mainContent) {
        const paragraphs = mainContent.querySelectorAll("p");
        if (paragraphs.length > 0) {
          return Array.from(paragraphs).slice(0, 5).map(p => p.textContent?.trim() || "").join(" ");
        }
      }
      const firstProse = document.querySelector(".prose");
      if (firstProse) {
        return firstProse.textContent?.trim().slice(0, 1500) || "";
      }
      const allP = document.querySelectorAll("p");
      return Array.from(allP).slice(0, 3).map(p => p.textContent?.trim() || "").join(" ");
    });

    console.log(`Found content length: ${content.length}`);

    const replies: Array<{ author: string; content: string; votes: number }> = [];

    const extractedReplies = await page.evaluate(() => {
      const results: Array<{ author: string; content: string; votes: number }> = [];
      
      const proseElements = document.querySelectorAll(".prose");
      
      proseElements.forEach((el, idx) => {
        if (idx === 0) return;
        
        const text = el.textContent?.trim() || "";
        if (text.length > 10 && text.length < 3000) {
          const parentContainer = el.closest("div[class*='border'], div[class*='rounded'], div[class*='bg-']");
          
          let author = "Anonymous";
          if (parentContainer) {
            const imgEl = parentContainer.querySelector("img[alt]") as HTMLImageElement;
            if (imgEl?.alt) {
              author = imgEl.alt.slice(0, 50);
            }
          }
          
          if (!results.some(r => r.content === text)) {
            results.push({
              author,
              content: text.slice(0, 1500),
              votes: 0,
            });
          }
        }
      });

      if (results.length === 0) {
        const replySelectors = [
          "[class*='Comment']",
          "[class*='comment']",
          "[class*='Reply']",
          "[class*='reply']",
          "[class*='response']",
        ];
        
        for (const selector of replySelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            const text = el.textContent?.trim() || "";
            if (text.length > 10 && text.length < 3000 && !results.some(r => r.content === text)) {
              const authorEl = el.querySelector("[class*='author'], [class*='user'], [class*='name'], img[alt]");
              const author = (authorEl as HTMLImageElement)?.alt || 
                            authorEl?.textContent?.trim()?.slice(0, 50) || 
                            "Anonymous";
              
              results.push({
                author,
                content: text.slice(0, 1500),
                votes: 0,
              });
            }
          });
        }
      }

      return results;
    });

    replies.push(...extractedReplies);
    console.log(`Found ${replies.length} replies`);

    if (title.toLowerCase().includes("not found") || title.toLowerCase().includes("404")) {
      throw new Error("Post not found. This post may have been deleted or the URL is incorrect.");
    }

    if (replies.length === 0 && content.length < 50) {
      throw new Error("Could not extract content from the page. The page may require authentication or has an unexpected structure.");
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
