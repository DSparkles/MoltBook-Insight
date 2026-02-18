import type { ScrapedReply } from "@shared/schema";

interface MoltbookPost {
  title: string;
  author: string;
  content: string;
  replies: ScrapedReply[];
}

const API_BASE = "https://www.moltbook.com/api/v1";

function extractPostId(postUrl: string): string {
  const match = postUrl.match(/\/post\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error("Invalid Moltbook post URL. Expected format: https://www.moltbook.com/post/{id}");
  }
  return match[1];
}

export async function scrapePost(postUrl: string): Promise<MoltbookPost> {
  const postId = extractPostId(postUrl);
  console.log(`Fetching post ${postId} from Moltbook API...`);

  const postRes = await fetch(`${API_BASE}/posts/${postId}`);
  if (!postRes.ok) {
    if (postRes.status === 404) {
      throw new Error("Post not found. It may have been deleted or the URL is incorrect.");
    }
    throw new Error(`Moltbook API error: ${postRes.status} ${postRes.statusText}`);
  }

  const postData = await postRes.json();
  const post = postData.post || postData;

  const title = post.title || "Moltbook Post";
  const author = post.author?.name || post.author_name || "Unknown";
  const content = post.content || post.body || post.text || "";

  console.log(`Post: "${title}" by ${author} (${post.comment_count || 0} comments)`);

  const commentsRes = await fetch(`${API_BASE}/posts/${postId}/comments`);
  const replies: ScrapedReply[] = [];

  if (commentsRes.ok) {
    const commentsData = await commentsRes.json();
    const comments = commentsData.comments || [];

    for (const comment of comments.slice(0, 50)) {
      if (comment.is_deleted) continue;

      const replyAuthor = comment.author?.name || "Anonymous";
      const replyContent = comment.content || "";

      if (replyContent.length > 0) {
        replies.push({
          author: String(replyAuthor).slice(0, 100),
          content: String(replyContent).slice(0, 5000),
          votes: comment.score ?? 0,
        });
      }
    }
  }

  console.log(`Found ${replies.length} replies via API`);

  return {
    title: String(title).slice(0, 500),
    author: String(author).slice(0, 100),
    content: String(content).slice(0, 5000),
    replies,
  };
}
