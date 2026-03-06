import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, BarChart3, MessageSquare, TrendingUp, Clock, ChevronRight, Info, Globe, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostAnalysis, ReplyScores } from "@shared/schema";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { ScoreRadar } from "@/components/score-radar";

interface OverallStats {
  totalAnalyses: number;
  totalReplies: number;
  totalCohesive: number;
  totalSpam: number;
  averageScores: ReplyScores | null;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();

  const { data: recentAnalyses, isLoading: loadingRecent } = useQuery<PostAnalysis[]>({
    queryKey: ["/api/analyses"],
  });

  const { data: overallStats, isLoading: loadingStats } = useQuery<OverallStats>({
    queryKey: ["/api/overall-stats"],
    refetchOnMount: "always",
    staleTime: 0,
  });

  const analysisMutation = useMutation({
    mutationFn: async (postUrl: string) => {
      const result = await apiRequest("POST", "/api/analyses", { postUrl });
      return result.json();
    },
    onSuccess: (data: PostAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/overall-stats"] });
      setLocation(`/analysis/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && url.includes("moltbook.com")) {
      analysisMutation.mutate(url.trim());
    }
  };

  const isValidUrl = url.includes("moltbook.com/post/");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Moltbook Analyzer</h1>
            </div>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            AI-powered analysis of Moltbook post replies. Evaluate cooperative intent, communication clarity, and more across 5 key dimensions.
          </p>
          <p className="text-sm text-primary font-medium mt-1">
            Now with Self-Tuning Reply Optimizer for agents
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
            <Link href="/about">
              <Button variant="ghost" data-testid="link-about">
                <Info className="w-4 h-4 mr-1" />
                Learn about the 5 dimensions
              </Button>
            </Link>
            <Button
              variant="outline"
              data-testid="button-export-all"
              onClick={() => { window.location.href = "/api/export-all"; }}
            >
              <Download className="w-4 h-4 mr-1" />
              Export All Data (CSV)
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5" />
              Analyze a Post
            </CardTitle>
            <CardDescription>
              Paste a Moltbook post URL to analyze its replies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                data-testid="input-url"
                type="url"
                placeholder="https://www.moltbook.com/post/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                data-testid="button-analyze"
                type="submit"
                disabled={!isValidUrl || analysisMutation.isPending}
              >
                {analysisMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </form>
            {analysisMutation.error && (
              <p className="text-sm text-destructive mt-3">
                Failed to start analysis. Please try again.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-chart-1/10">
                  <MessageSquare className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Reply Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Categorize replies as cohesive/helpful or spam/argumentative
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-chart-3/10">
                  <TrendingUp className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">5 Dimensions</h3>
                  <p className="text-sm text-muted-foreground">
                    Scores on cooperative intent, clarity, ethics & more
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-chart-4/10">
                  <BarChart3 className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Visual Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Charts and breakdowns of community behavior
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {overallStats && overallStats.totalAnalyses > 0 && (
          <Card className="mb-10">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Overall Moltbook Analysis
              </CardTitle>
              <CardDescription>
                Aggregated scores across {overallStats.totalAnalyses} analyzed posts and {overallStats.totalReplies} total replies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold" data-testid="text-total-analyses">
                    {overallStats.totalAnalyses}
                  </div>
                  <div className="text-sm text-muted-foreground">Posts Analyzed</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold" data-testid="text-total-replies">
                    {overallStats.totalReplies}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Replies</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-cohesive">
                    {overallStats.totalCohesive}
                  </div>
                  <div className="text-sm text-muted-foreground">Cohesive & Helpful</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-spam">
                    {overallStats.totalSpam}
                  </div>
                  <div className="text-sm text-muted-foreground">Argumentative & Spam</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2 text-sm text-center">Category Distribution</h4>
                  <CategoryPieChart 
                    cohesive={overallStats.totalCohesive} 
                    spam={overallStats.totalSpam} 
                  />
                </div>
                {overallStats.averageScores && (
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2 text-sm text-center">Average Dimension Scores</h4>
                    <ScoreRadar scores={overallStats.averageScores} />
                  </div>
                )}
              </div>

              {overallStats.averageScores && (
                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">Score Breakdown (1-7 scale)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="flex flex-col items-center p-3 rounded-lg border">
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400" data-testid="text-avg-cooperative">
                        {overallStats.averageScores.cooperativeIntent}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">Cooperative Intent</div>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg border">
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400" data-testid="text-avg-clarity">
                        {overallStats.averageScores.communicationClarity}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">Clarity</div>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg border">
                      <div className="text-lg font-semibold text-purple-600 dark:text-purple-400" data-testid="text-avg-knowledge">
                        {overallStats.averageScores.knowledgeSharing}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">Knowledge Sharing</div>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg border">
                      <div className="text-lg font-semibold text-amber-600 dark:text-amber-400" data-testid="text-avg-ethical">
                        {overallStats.averageScores.ethicalConsideration}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">Ethical Consideration</div>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg border">
                      <div className="text-lg font-semibold text-rose-600 dark:text-rose-400" data-testid="text-avg-alignment">
                        {overallStats.averageScores.humanAlignment}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">Human Alignment</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Analyses
          </h2>
          {loadingRecent ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </CardContent>
            </Card>
          ) : recentAnalyses && recentAnalyses.length > 0 ? (
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map((analysis) => (
                <Card
                  key={analysis.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/analysis/${analysis.id}`)}
                  data-testid={`card-analysis-${analysis.id}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {analysis.postTitle || (() => {
                            const match = analysis.postUrl.match(/\/post\/([^/]+)/);
                            return match ? `Post ${match[1].slice(0, 8)}...` : "Moltbook Post";
                          })()}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {analysis.postUrl}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={analysis.status === "completed" ? "default" : "secondary"}>
                          {analysis.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {analysis.totalReplies} replies
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No analyses yet. Paste a Moltbook URL above to get started!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
