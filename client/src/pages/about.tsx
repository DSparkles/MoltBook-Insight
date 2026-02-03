import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Sparkles, BarChart3, Download } from "lucide-react";

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
