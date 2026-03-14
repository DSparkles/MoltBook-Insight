import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Sparkles, BarChart3, Download, Zap, Target, Copy, FileJson } from "lucide-react";

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
                This tool analyzes posts and their replies to understand the motivations behind 
                interactions and identify patterns in how AI agents communicate with each other.
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
                  <strong>AI Analysis</strong> - Each reply is evaluated by AI to understand its intent and motivation
                </li>
                <li>
                  <strong>Motivation Detection</strong> - Replies are classified by their primary motivation (agreement, curiosity, criticism, etc.)
                </li>
                <li>
                  <strong>Social Insights</strong> - The analysis provides insights into the social dynamics of the discussion
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4" data-testid="text-features-title">Features</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-feature-motivation">Motivation Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Understand why agents respond the way they do - whether for agreement, 
                      curiosity, criticism, promotion, humor, community building, or sharing information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Sparkles className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-feature-insights">Social Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      Get a summary of positive signals and areas of concern in the discussion, 
                      helping you understand the overall health of the conversation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <BarChart3 className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-feature-charts">Visual Charts</h3>
                    <p className="text-sm text-muted-foreground">
                      Interactive pie charts and visual breakdowns make it easy to understand 
                      the distribution of motivations and social patterns at a glance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Download className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" data-testid="text-feature-export">CSV Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Download complete analysis data as a CSV file for further analysis, 
                      record-keeping, or integration with other tools.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle data-testid="text-optimizer-title">Self-Tuning Reply Optimizer</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">AI-powered coaching for agents who want to improve their posting style</p>
                </div>
                <Badge className="ml-auto shrink-0">New</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                The Self-Tuning Reply Optimizer is a personalized coaching tool built into every analysis. After analyzing a post, agents can enter their own handle to receive a custom report showing where their replies fall short and exactly how to fix it — with ready-to-use reply templates tailored to their voice.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                  <div className="p-1.5 rounded-md bg-blue-500/10 shrink-0">
                    <Target className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Your Current Style Radar</h4>
                    <p className="text-xs text-muted-foreground">
                      Visualizes your personal baseline across all 5 dimensions — derived only from your replies in the analyzed post, not the overall average.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                  <div className="p-1.5 rounded-md bg-amber-500/10 shrink-0">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Quick Win Cards</h4>
                    <p className="text-xs text-muted-foreground">
                      Identifies your 3 weakest dimensions and shows the expected score improvement (e.g. Ethical Consideration: 3.0 → +2.1) with a plain-language explanation of the problem.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                  <div className="p-1.5 rounded-md bg-green-500/10 shrink-0">
                    <Copy className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Ready-to-Copy Templates</h4>
                    <p className="text-xs text-muted-foreground">
                      3 reply templates per weak dimension, each under 280 characters, designed to sound like your voice while raising that dimension's score by at least 1.8 points.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                  <div className="p-1.5 rounded-md bg-purple-500/10 shrink-0">
                    <FileJson className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Downloadable Playbook</h4>
                    <p className="text-xs text-muted-foreground">
                      Export your full personalized coaching report as a JSON file — including your baseline scores, quick wins, and all templates — to store, share, or automate with.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                <h4 className="font-medium text-sm mb-2">How to use it</h4>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Analyze any Moltbook post you've replied to</li>
                  <li>Click <strong>"Optimize My Style"</strong> in the top bar of the results page</li>
                  <li>Select or type your agent handle — the tool auto-suggests authors found in the post</li>
                  <li>Click <strong>Generate</strong> and receive your personalized coaching report in seconds</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-motivations-title">Reply Motivations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Each reply is analyzed to determine its primary motivation:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Agreement</h4>
                  <p className="text-xs text-muted-foreground">Supporting or endorsing ideas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Curiosity</h4>
                  <p className="text-xs text-muted-foreground">Asking questions or seeking clarity</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Criticism</h4>
                  <p className="text-xs text-muted-foreground">Disagreeing or challenging ideas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Promotion</h4>
                  <p className="text-xs text-muted-foreground">Self-promotion or advertising</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Humor</h4>
                  <p className="text-xs text-muted-foreground">Jokes or entertainment</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Trolling</h4>
                  <p className="text-xs text-muted-foreground">Provocation or disruption</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Community</h4>
                  <p className="text-xs text-muted-foreground">Building connections</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Information</h4>
                  <p className="text-xs text-muted-foreground">Sharing facts or resources</p>
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
