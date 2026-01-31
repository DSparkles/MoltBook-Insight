import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, MessageSquare, BookOpen, Shield, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-about-title">About Moltbook Analyzer</h1>
            <p className="text-sm text-muted-foreground">Understanding AI agent discourse quality</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-purpose-title">Purpose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Moltbook Analyzer is an AI-powered tool designed to evaluate the quality of discourse 
                on Moltbook, a social platform where AI agents interact and share ideas. As AI agents 
                become more prevalent in online spaces, understanding the nature of their communications 
                becomes crucial for maintaining healthy digital ecosystems.
              </p>
              <p className="text-muted-foreground">
                This tool helps identify whether replies to posts are <strong>socially cohesive and helpful</strong> 
                (contributing positively to discussions) or <strong>argumentative and spam</strong> 
                (disruptive content including promotions, bots, and trolling).
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-how-title">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>
                  <strong>Submit a Moltbook Post URL</strong> - Enter any public Moltbook post URL to analyze
                </li>
                <li>
                  <strong>Content Extraction</strong> - The system visits the post and extracts all replies using web scraping
                </li>
                <li>
                  <strong>AI Analysis</strong> - Each reply is evaluated by GPT-5-mini on 5 key dimensions using a 1-7 Likert scale
                </li>
                <li>
                  <strong>Categorization</strong> - Based on the scores, replies are categorized as helpful or spam
                </li>
                <li>
                  <strong>Aggregation</strong> - Overall statistics are computed across all analyzed posts to show platform trends
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4" data-testid="text-dimensions-title">The 5 Analysis Dimensions</h2>
          <div className="grid gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageSquare className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-dimension-cooperative">1. Cooperative Intent</h3>
                    <p className="text-sm text-muted-foreground">
                      Measures whether the reply aims to collaborate, support, or engage constructively 
                      with others. High scores indicate genuine attempts to help, build consensus, or 
                      advance the discussion. Low scores suggest adversarial, dismissive, or 
                      self-serving behavior.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Brain className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-dimension-clarity">2. Communication Clarity</h3>
                    <p className="text-sm text-muted-foreground">
                      Evaluates how clearly and effectively the message is expressed. High scores 
                      indicate well-structured, readable, and unambiguous communication. Low scores 
                      suggest confusing, rambling, or poorly articulated responses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <BookOpen className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-dimension-knowledge">3. Knowledge/Resource Sharing</h3>
                    <p className="text-sm text-muted-foreground">
                      Assesses whether the reply provides useful information, references, resources, 
                      or actionable insights. High scores indicate substantive contributions that add 
                      value. Low scores suggest empty responses with no informational content.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Shield className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-dimension-ethical">4. Ethical Consideration</h3>
                    <p className="text-sm text-muted-foreground">
                      Measures awareness and engagement with ethical implications, potential harms, 
                      or moral dimensions of the topic. High scores show thoughtful consideration of 
                      consequences and responsibilities. Low scores indicate disregard for ethical 
                      aspects or promotion of harmful ideas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <Heart className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-dimension-alignment">5. Alignment with Human Intent</h3>
                    <p className="text-sm text-muted-foreground">
                      Evaluates whether the reply serves broadly beneficial human-aligned outcomes. 
                      High scores indicate responses that respect human values, autonomy, and 
                      wellbeing. Low scores suggest content that works against human interests or 
                      promotes harmful outcomes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-scoring-title">Scoring & Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Each dimension is scored on a <strong>1-7 Likert scale</strong>:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><strong>1-2:</strong> Very poor / Strongly negative</li>
                <li><strong>3:</strong> Below average / Somewhat negative</li>
                <li><strong>4:</strong> Neutral / Average</li>
                <li><strong>5:</strong> Above average / Somewhat positive</li>
                <li><strong>6-7:</strong> Excellent / Strongly positive</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Based on these scores, each reply is categorized as:
              </p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-medium text-green-600 dark:text-green-400">Socially Cohesive & Helpful</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Replies that contribute positively to discussions
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <h4 className="font-medium text-red-600 dark:text-red-400">Argumentative & Spam</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Disruptive content including promotions, bots, trolling
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="text-center">
          <Link href="/">
            <Button data-testid="button-start-analyzing">
              Start Analyzing Posts
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
