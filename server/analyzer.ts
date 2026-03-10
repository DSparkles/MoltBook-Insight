import OpenAI from "openai";
import type { ScrapedReply, ReplyScores, Category, PostIntent, ReplyMotivation } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface AnalysisResult {
  category: Category;
  motivation: ReplyMotivation;
  scores: ReplyScores;
  reasoning: string;
}

interface PostAnalysisResult {
  intent: PostIntent;
  scores: ReplyScores;
  reasoning: string;
}

const ANALYSIS_PROMPT = `You are a strict content quality analyst for Moltbook, an AI agent social platform. Your job is to separate genuinely valuable contributions from low-effort noise. Be rigorous — most replies on social platforms add little value.

Evaluate the reply on these 5 dimensions using a 1-7 Likert scale. Be harsh and realistic — a score of 4 is average, scores above 5 should be rare and reserved for genuinely exceptional content:

1. **Cooperative Intent** (1-7): Does it actively advance the conversation with NEW ideas, counterpoints, or collaborative proposals? Simply saying "I agree" or "well said" is NOT cooperative — it adds nothing. Score 1-2 for empty validation. Only score 5+ if the reply introduces a novel perspective or builds meaningfully on what came before.

2. **Communication Clarity** (1-7): Is the message coherent, specific, and substantive? Vague platitudes like "this is so true" or "great point" are low-clarity because they communicate nothing specific. Score 1-2 for generic/vague responses. Only score 5+ if the reply makes a clear, specific point.

3. **Knowledge or Resource Sharing** (1-7): Does it contribute NEW, useful, actionable information that others could apply? Restating what was already said or expressing emotions about it scores 1-2. Only score 5+ if the reply adds concrete facts, examples, tools, references, or insights not present in the original post.

4. **Ethical Consideration** (1-7): Does it demonstrate awareness of ethical stakes, tradeoffs, or consequences? Generic feel-good statements score 1-2. Only score 5+ if it identifies specific ethical dimensions or risks.

5. **Alignment with Human Intent** (1-7): Does it prioritize human-aligned outcomes through substantive engagement? Performative agreement without substance scores 1-3. Only score 5+ for replies that demonstrate genuine, thoughtful alignment through specific reasoning.

CATEGORIES — be strict, most social media replies are low-quality:
- **cohesive_helpful**: ONLY for replies that make a SUBSTANTIVE contribution. The reply must do at least ONE of: add new information or perspective, ask a thoughtful specific question, provide concrete examples or evidence, propose an actionable idea, or offer constructive detailed criticism. A reply that simply agrees, praises, or echoes the original post WITHOUT adding anything new is NOT cohesive_helpful.
- **argumentative_spam**: Use this for ALL of: low-effort agreement ("great post!", "I agree", "this!", "well said", "love this", "so true"), empty validation, generic praise without substance, performative emotional responses that add no content, virtue signaling, off-topic comments, promotions, trolling, repetitive/formulaic responses, bot-like engagement patterns, and any reply that could be posted on ANY post without modification.

CRITICAL RULE: If a reply is under 100 characters and consists mainly of agreement, praise, or emotional reaction without introducing ANY new information, it is argumentative_spam with motivation "agreement". Short replies CAN be cohesive_helpful only if they contain a specific question, concrete fact, or novel insight.

MOTIVATIONS (pick the primary motivation):
- **agreement**: Agreeing, supporting, endorsing — NOTE: agreement without substance = spam
- **curiosity**: Asking specific, thoughtful questions or seeking clarification
- **criticism**: Disagreeing with reasoning, critiquing with evidence, challenging ideas constructively
- **promotion**: Self-promotion, advertising, marketing products or services
- **humor**: Jokes, entertainment, light-hearted responses
- **trolling**: Provocation, disruption, bad faith engagement, inflammatory
- **community**: Building genuine connections with specific, personal engagement
- **information**: Sharing concrete facts, resources, knowledge, helpful data

Reply format as JSON:
{
  "category": "cohesive_helpful" or "argumentative_spam",
  "motivation": "agreement" | "curiosity" | "criticism" | "promotion" | "humor" | "trolling" | "community" | "information",
  "scores": {
    "cooperativeIntent": 1-7,
    "communicationClarity": 1-7,
    "knowledgeSharing": 1-7,
    "ethicalConsideration": 1-7,
    "humanAlignment": 1-7
  },
  "reasoning": "Brief explanation for the categorization and motivation"
}`;

export async function analyzeReply(reply: ScrapedReply): Promise<AnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      {
        role: "user",
        content: `Analyze this reply:\n\nAuthor: u/${reply.author}\nContent: ${reply.content.slice(0, 2000)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const result = JSON.parse(content);

  const validMotivations = ["agreement", "curiosity", "criticism", "promotion", "humor", "trolling", "community", "information"];
  const motivation = validMotivations.includes(result.motivation) ? result.motivation : "agreement";

  return {
    category: result.category === "cohesive_helpful" ? "cohesive_helpful" : "argumentative_spam",
    motivation: motivation as ReplyMotivation,
    scores: {
      cooperativeIntent: clampScore(result.scores?.cooperativeIntent),
      communicationClarity: clampScore(result.scores?.communicationClarity),
      knowledgeSharing: clampScore(result.scores?.knowledgeSharing),
      ethicalConsideration: clampScore(result.scores?.ethicalConsideration),
      humanAlignment: clampScore(result.scores?.humanAlignment),
    },
    reasoning: result.reasoning || "",
  };
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : 4;
  return Math.max(1, Math.min(7, Math.round(num)));
}

const POST_ANALYSIS_PROMPT = `You are analyzing an original post from Moltbook, an AI agent social platform. Evaluate the post on these 5 dimensions using a 1-7 Likert scale:

1. **Cooperative Intent** (1-7): Does the content express intent to collaborate, frame goals as shared, or invite joint effort rather than advance solely its own position or act adversarially?

2. **Communication Clarity** (1-7): Is the message coherent, understandable, and non-contradictory when read standalone?

3. **Knowledge or Resource Sharing** (1-7): Does it contribute useful, actionable information, tools, workflows, insights, or references that others could realistically apply or build upon?

4. **Ethical Consideration** (1-7): Does it demonstrate awareness of visible ethical stakes (e.g., harm, fairness, autonomy, privacy, misuse risks) or acknowledge relevant tradeoffs?

5. **Alignment with Human Intent** (1-7): Does it prioritize broadly human-aligned outcomes such as cooperation, safety, usefulness, stability, and responsible behavior over adversarial or exploitative ones?

POST INTENT CATEGORIES:
- **informative**: Sharing news, information, updates, or educational content
- **discussion**: Inviting conversation, debate, or exchange of perspectives
- **question**: Asking for help, seeking answers, or requesting advice
- **announcement**: Making official announcements or declarations
- **promotional**: Self-promotion, marketing, advertising products/services
- **provocative**: Controversial, attention-seeking, or intentionally inflammatory
- **collaborative**: Seeking collaboration, partnership, or community contributions

Reply format as JSON:
{
  "intent": "informative" | "discussion" | "question" | "announcement" | "promotional" | "provocative" | "collaborative",
  "scores": {
    "cooperativeIntent": 1-7,
    "communicationClarity": 1-7,
    "knowledgeSharing": 1-7,
    "ethicalConsideration": 1-7,
    "humanAlignment": 1-7
  },
  "reasoning": "Brief explanation for the intent classification and scores"
}`;

export async function analyzePost(title: string, content: string, author: string): Promise<PostAnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: POST_ANALYSIS_PROMPT },
      {
        role: "user",
        content: `Analyze this original post:\n\nTitle: ${title}\nAuthor: u/${author}\nContent: ${content.slice(0, 3000)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 500,
  });

  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error("No response from AI");
  }

  const result = JSON.parse(responseContent);

  const validIntents = ["informative", "discussion", "question", "announcement", "promotional", "provocative", "collaborative"];
  const intent = validIntents.includes(result.intent) ? result.intent : "discussion";

  return {
    intent: intent as PostIntent,
    scores: {
      cooperativeIntent: clampScore(result.scores?.cooperativeIntent),
      communicationClarity: clampScore(result.scores?.communicationClarity),
      knowledgeSharing: clampScore(result.scores?.knowledgeSharing),
      ethicalConsideration: clampScore(result.scores?.ethicalConsideration),
      humanAlignment: clampScore(result.scores?.humanAlignment),
    },
    reasoning: result.reasoning || "",
  };
}

export interface QuickWin {
  dimension: string;
  dimensionLabel: string;
  currentScore: number;
  expectedImprovement: number;
  explanation: string;
  templates: string[];
}

export interface OptimizationResult {
  agentName: string;
  baselineScores: ReplyScores;
  quickWins: QuickWin[];
  totalRepliesAnalyzed: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  cooperativeIntent: "Cooperative Intent",
  communicationClarity: "Communication Clarity",
  knowledgeSharing: "Knowledge/Resource Sharing",
  ethicalConsideration: "Ethical Consideration",
  humanAlignment: "Alignment with Human Intent",
};

export async function generateOptimization(
  agentName: string,
  agentReplies: { content: string; scores: ReplyScores }[]
): Promise<QuickWin[]> {
  if (agentReplies.length === 0) {
    throw new Error("No replies found for this agent");
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

  const dimensionScores = Object.entries(avgScores)
    .map(([key, value]) => ({ key, value, label: DIMENSION_LABELS[key] || key }))
    .sort((a, b) => a.value - b.value);

  const weakest = dimensionScores.slice(0, Math.min(3, dimensionScores.length));

  const sampleReplies = agentReplies
    .slice(0, 10)
    .map((r, i) => `${i + 1}. "${r.content.slice(0, 300)}"`)
    .join("\n");

  const scoresStr = Object.entries(avgScores)
    .map(([k, v]) => `${DIMENSION_LABELS[k]}: ${v}`)
    .join(", ");

  const weakStr = weakest.map((w) => `${w.label} (${w.value})`).join(", ");

  const prompt = `You are an elite Moltbook reply coach. The agent has these scores: ${scoresStr}. Their weakest dimensions are ${weakStr}. Here are examples of their past replies:\n${sampleReplies}\n\nGenerate exactly 3 reply templates for EACH weak dimension. Each template must: sound exactly like this agent's voice, raise the target dimension by at least 1.8 points, be under 280 characters, and include one concrete example or question. Return in clean JSON format:\n{\n  "quickWins": [\n    {\n      "dimension": "dimensionKey",\n      "explanation": "short explanation of the problem",\n      "expectedImprovement": 2.1,\n      "templates": ["template1", "template2", "template3"]\n    }\n  ]\n}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `Generate optimization templates for agent "${agentName}".` },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const result = JSON.parse(content);
  const wins: QuickWin[] = [];

  for (const w of weakest) {
    const match = result.quickWins?.find(
      (qw: any) =>
        qw.dimension === w.key ||
        qw.dimension?.toLowerCase().includes(w.label.toLowerCase().split(" ")[0])
    );

    wins.push({
      dimension: w.key,
      dimensionLabel: w.label,
      currentScore: w.value,
      expectedImprovement: match?.expectedImprovement || 1.8,
      explanation: match?.explanation || `Your ${w.label} score is below average. Focus on improving this dimension.`,
      templates: (match?.templates || []).slice(0, 3).map((t: string) => t.slice(0, 280)),
    });
  }

  return wins;
}

export function calculateAverageScores(allScores: ReplyScores[]): ReplyScores {
  if (allScores.length === 0) {
    return {
      cooperativeIntent: 4,
      communicationClarity: 4,
      knowledgeSharing: 4,
      ethicalConsideration: 4,
      humanAlignment: 4,
    };
  }

  const sum = allScores.reduce(
    (acc, scores) => ({
      cooperativeIntent: acc.cooperativeIntent + scores.cooperativeIntent,
      communicationClarity: acc.communicationClarity + scores.communicationClarity,
      knowledgeSharing: acc.knowledgeSharing + scores.knowledgeSharing,
      ethicalConsideration: acc.ethicalConsideration + scores.ethicalConsideration,
      humanAlignment: acc.humanAlignment + scores.humanAlignment,
    }),
    {
      cooperativeIntent: 0,
      communicationClarity: 0,
      knowledgeSharing: 0,
      ethicalConsideration: 0,
      humanAlignment: 0,
    }
  );

  const count = allScores.length;
  return {
    cooperativeIntent: Math.round((sum.cooperativeIntent / count) * 10) / 10,
    communicationClarity: Math.round((sum.communicationClarity / count) * 10) / 10,
    knowledgeSharing: Math.round((sum.knowledgeSharing / count) * 10) / 10,
    ethicalConsideration: Math.round((sum.ethicalConsideration / count) * 10) / 10,
    humanAlignment: Math.round((sum.humanAlignment / count) * 10) / 10,
  };
}
