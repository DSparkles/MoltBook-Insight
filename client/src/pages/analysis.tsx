import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  XCircle,
  MessageSquare,
  TrendingUp,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type { PostAnalysis, ReplyAnalysis, ReplyScores } from "@shared/schema";
import { ScoreRadar } from "@/components/score-radar";
import { CategoryPieChart } from "@/components/category-pie-chart";
import { ReplyCard } from "@/components/reply-card";

interface AnalysisWithReplies extends PostAnalysis {
  replies: ReplyAnalysis[];
}

export default function AnalysisPage() {
  const [, params] = useRoute("/analysis/:id");
  const [, setLocation] = useLocation();
  const analysisId = params?.id;

  const { data: analysis, isLoading, refetch, isRefetching } = useQuery<AnalysisWithReplies>({
    queryKey: ["/api/analyses", analysisId],
    refetchInterval: (data) => {
      const status = data?.state?.data?.status;
      return status === "analyzing" || status === "pending" ? 3000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-3" />
            <h2 className="font-semibold mb-2">Analysis Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This analysis doesn't exist or has been deleted.
            </p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = analysis.status === "analyzing" || analysis.status === "pending";
  const cohesiveReplies = analysis.replies?.filter((r) => r.category === "cohesive_helpful") || [];
  const spamReplies = analysis.replies?.filter((r) => r.category === "argumentative_spam") || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {analysis.postTitle || "Post Analysis"}
            </h1>
            <a
              href={analysis.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {analysis.postUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <Badge variant={analysis.status === "completed" ? "default" : "secondary"} className="shrink-0">
            {analysis.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {isProcessing && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            {analysis.status}
          </Badge>
          {!isProcessing && (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        {isProcessing && (
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Analyzing replies...</p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.replies?.length || 0} of {analysis.totalReplies || "?"} replies analyzed
                  </p>
                </div>
              </div>
              {analysis.totalReplies && analysis.totalReplies > 0 && (
                <Progress
                  value={((analysis.replies?.length || 0) / analysis.totalReplies) * 100}
                  className="mt-4"
                />
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Total Replies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analysis.totalReplies || 0}</div>
              <p className="text-sm text-muted-foreground">
                {analysis.replies?.length || 0} analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-chart-3" />
                Cohesive & Helpful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{cohesiveReplies.length}</div>
              <p className="text-sm text-muted-foreground">
                {analysis.replies?.length ? Math.round((cohesiveReplies.length / analysis.replies.length) * 100) : 0}% of analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Spam & Argumentative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{spamReplies.length}</div>
              <p className="text-sm text-muted-foreground">
                {analysis.replies?.length ? Math.round((spamReplies.length / analysis.replies.length) * 100) : 0}% of analyzed
              </p>
            </CardContent>
          </Card>
        </div>

        {analysis.replies && analysis.replies.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Category Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of reply types</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryPieChart
                    cohesive={cohesiveReplies.length}
                    spam={spamReplies.length}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Average Scores
                  </CardTitle>
                  <CardDescription>Across all 5 evaluation dimensions</CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.averageScores ? (
                    <ScoreRadar scores={analysis.averageScores} />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Scores not yet available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all">
                  All ({analysis.replies.length})
                </TabsTrigger>
                <TabsTrigger value="cohesive" data-testid="tab-cohesive">
                  Cohesive ({cohesiveReplies.length})
                </TabsTrigger>
                <TabsTrigger value="spam" data-testid="tab-spam">
                  Spam ({spamReplies.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {analysis.replies.map((reply) => (
                      <ReplyCard key={reply.id} reply={reply} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="cohesive" className="mt-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {cohesiveReplies.map((reply) => (
                      <ReplyCard key={reply.id} reply={reply} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="spam" className="mt-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {spamReplies.map((reply) => (
                      <ReplyCard key={reply.id} reply={reply} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
