import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, BarChart3, MessageSquare, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostAnalysis } from "@shared/schema";

export default function Home() {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();

  const { data: recentAnalyses, isLoading: loadingRecent } = useQuery<PostAnalysis[]>({
    queryKey: ["/api/analyses"],
  });

  const analysisMutation = useMutation({
    mutationFn: async (postUrl: string) => {
      const result = await apiRequest("POST", "/api/analyses", { postUrl });
      return result.json();
    },
    onSuccess: (data: PostAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
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
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Moltbook Analyzer</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            AI-powered analysis of Moltbook post replies. Evaluate cooperative intent, communication clarity, and more across 5 key dimensions.
          </p>
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
                          {analysis.postTitle || "Untitled Post"}
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
