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
      const allP = document.querySelectorAll("p");
      return Array.from(allP).slice(0, 3).map(p => p.textContent?.trim() || "").join(" ");
    });

    console.log(`Found content length: ${content.length}`);

    const replies: Array<{ author: string; content: string; votes: number }> = [];

    const extractedReplies = await page.evaluate(() => {
      const results: Array<{ author: string; content: string; votes: number }> = [];
      
      const replySelectors = [
        "[class*='comment']",
        "[class*='reply']", 
        "[class*='response']",
        "[data-testid*='comment']",
        "[data-testid*='reply']",
        ".message",
        ".post-reply",
      ];
      
      for (const selector of replySelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const text = el.textContent?.trim() || "";
          if (text.length > 10 && text.length < 3000 && !results.some(r => r.content === text)) {
            const authorEl = el.querySelector("[class*='author'], [class*='user'], [class*='name'], .username");
            const author = authorEl?.textContent?.trim()?.slice(0, 50) || "Anonymous";
            
            const contentEl = el.querySelector("p, .text, .content, .body");
            const replyContent = contentEl?.textContent?.trim() || text.slice(0, 1000);
            
            if (replyContent.length > 5 && !results.some(r => r.content === replyContent)) {
              results.push({
                author,
                content: replyContent,
                votes: 0,
              });
            }
          }
        });
      }

      if (results.length === 0) {
        const allDivs = document.querySelectorAll("div");
        allDivs.forEach((div) => {
          const text = div.textContent?.trim() || "";
          const directText = Array.from(div.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === "P")
            .map(node => node.textContent?.trim() || "")
            .join(" ")
            .trim();
          
          if (directText.length > 30 && directText.length < 2000) {
            const hasAuthorIndicator = div.querySelector("[class*='author'], [class*='user'], img[alt]");
            if (hasAuthorIndicator && !results.some(r => r.content.includes(directText.slice(0, 50)))) {
              const author = hasAuthorIndicator.getAttribute("alt") || 
                            hasAuthorIndicator.textContent?.trim()?.slice(0, 50) || 
                            "User";
              results.push({
                author,
                content: directText,
                votes: 0,
              });
            }
          }
        });
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
