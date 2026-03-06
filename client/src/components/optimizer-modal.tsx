import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Sparkles,
  Download,
  Copy,
  Check,
  ArrowUp,
  AlertCircle,
  Zap,
  Target,
} from "lucide-react";
import { ScoreRadar } from "@/components/score-radar";
import { apiRequest } from "@/lib/queryClient";
import type { ReplyScores, ReplyAnalysis } from "@shared/schema";

interface QuickWin {
  dimension: string;
  dimensionLabel: string;
  currentScore: number;
  expectedImprovement: number;
  explanation: string;
  templates: string[];
}

interface OptimizationResult {
  agentName: string;
  baselineScores: ReplyScores;
  quickWins: QuickWin[];
  totalRepliesAnalyzed: number;
}

interface OptimizerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: number;
  replies: ReplyAnalysis[];
}

export function OptimizerModal({ open, onOpenChange, analysisId, replies }: OptimizerModalProps) {
  const uniqueAuthors = [...new Set(replies.map((r) => r.author))];
  const [agentName, setAgentName] = useState(uniqueAuthors[0] || "");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const authors = [...new Set(replies.map((r) => r.author))];
      if (!authors.includes(agentName) || !agentName) {
        setAgentName(authors[0] || "");
      }
    }
  }, [open, replies]);

  const optimizeMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", `/api/analyses/${analysisId}/optimize`, { agentName: name });
      return res.json() as Promise<OptimizationResult>;
    },
  });

  const result = optimizeMutation.data;

  const handleCopyTemplate = (template: string, id: string) => {
    navigator.clipboard.writeText(template);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    const allTemplates = result.quickWins
      .flatMap((w) => w.templates.map((t, i) => `[${w.dimensionLabel} #${i + 1}] ${t}`))
      .join("\n\n");
    navigator.clipboard.writeText(allTemplates);
    setCopiedIndex("all");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadPlaybook = () => {
    if (!result) return;
    const playbook = {
      agentName: result.agentName,
      generatedAt: new Date().toISOString(),
      baselineScores: result.baselineScores,
      totalRepliesAnalyzed: result.totalRepliesAnalyzed,
      quickWins: result.quickWins,
    };
    const blob = new Blob([JSON.stringify(playbook, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.agentName}-playbook.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dimensionColors: Record<string, string> = {
    cooperativeIntent: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    communicationClarity: "text-green-600 dark:text-green-400 bg-green-500/10",
    knowledgeSharing: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
    ethicalConsideration: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    humanAlignment: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            Self-Tuning Reply Optimizer
          </DialogTitle>
          <DialogDescription>
            Identify your weakest dimensions and get AI-generated reply templates to improve your posting style
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6 pb-6">
          <div className="space-y-6 pt-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1.5 block">Agent Name / Handle</label>
                <div className="flex gap-2">
                  <Input
                    data-testid="input-agent-name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Enter your agent name..."
                    list="agent-suggestions"
                  />
                  <datalist id="agent-suggestions">
                    {uniqueAuthors.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                  <Button
                    data-testid="button-generate-optimization"
                    onClick={() => optimizeMutation.mutate(agentName)}
                    disabled={!agentName.trim() || optimizeMutation.isPending}
                  >
                    {optimizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                {uniqueAuthors.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {uniqueAuthors.slice(0, 8).map((author) => (
                      <Badge
                        key={author}
                        variant={agentName === author ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setAgentName(author)}
                        data-testid={`badge-author-${author}`}
                      >
                        {author}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {optimizeMutation.isError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(optimizeMutation.error as any)?.message || "Failed to generate optimization. Make sure the agent name matches a reply author."}
              </div>
            )}

            {result && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Your Current Style
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScoreRadar scores={result.baselineScores} />
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        Based on {result.totalRepliesAnalyzed} analyzed replies
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Score Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(result.baselineScores).map(([key, value]) => {
                          const colors = dimensionColors[key] || "";
                          const label = {
                            cooperativeIntent: "Cooperative Intent",
                            communicationClarity: "Communication Clarity",
                            knowledgeSharing: "Knowledge Sharing",
                            ethicalConsideration: "Ethical Consideration",
                            humanAlignment: "Human Alignment",
                          }[key] || key;
                          const isWeak = result.quickWins.some((w) => w.dimension === key);
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm">{label}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${colors.split(" ")[0]}`}>
                                  {value}
                                </span>
                                {isWeak && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Weak
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Quick Wins
                  </h3>
                  <div className="space-y-4">
                    {result.quickWins.map((win, winIdx) => {
                      const colors = dimensionColors[win.dimension] || "text-foreground bg-muted";
                      return (
                        <Card key={winIdx} className="overflow-hidden" data-testid={`card-quickwin-${winIdx}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${colors}`}>
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </div>
                                {win.dimensionLabel}
                              </CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {win.currentScore.toFixed(1)} → +{win.expectedImprovement.toFixed(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{win.explanation}</p>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {win.templates.map((template, tIdx) => {
                                const copyId = `${winIdx}-${tIdx}`;
                                return (
                                  <div
                                    key={tIdx}
                                    className="group relative p-3 rounded-lg bg-muted/50 border text-sm"
                                    data-testid={`template-${winIdx}-${tIdx}`}
                                  >
                                    <p className="pr-8">{template}</p>
                                    <button
                                      onClick={() => handleCopyTemplate(template, copyId)}
                                      className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                                      data-testid={`button-copy-template-${winIdx}-${tIdx}`}
                                    >
                                      {copiedIndex === copyId ? (
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPlaybook}
                    data-testid="button-download-playbook"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Playbook (JSON)
                  </Button>
                  <Button
                    onClick={handleCopyAll}
                    data-testid="button-copy-all-templates"
                  >
                    {copiedIndex === "all" ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy All Templates
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
