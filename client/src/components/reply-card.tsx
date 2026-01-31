import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, User } from "lucide-react";
import type { ReplyAnalysis } from "@shared/schema";

interface ReplyCardProps {
  reply: ReplyAnalysis;
}

const dimensionLabels: Record<string, string> = {
  cooperativeIntent: "Cooperative Intent",
  communicationClarity: "Communication Clarity",
  knowledgeSharing: "Knowledge Sharing",
  ethicalConsideration: "Ethical Consideration",
  humanAlignment: "Human Alignment",
};

export function ReplyCard({ reply }: ReplyCardProps) {
  const isCohesive = reply.category === "cohesive_helpful";
  const scores = reply.scores as Record<string, number>;

  return (
    <Card data-testid={`reply-card-${reply.id}`} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-base truncate">u/{reply.author}</CardTitle>
          </div>
          <Badge
            variant={isCohesive ? "default" : "destructive"}
            className="shrink-0"
          >
            {isCohesive ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Cohesive
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Spam
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {reply.content.slice(0, 500)}
          {reply.content.length > 500 && "..."}
        </p>

        <div className="space-y-2">
          {Object.entries(scores).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-32 shrink-0">
                {dimensionLabels[key] || key}
              </span>
              <Progress
                value={(value / 7) * 100}
                className="flex-1 h-2"
              />
              <span className="text-xs font-medium w-6 text-right">{value}/7</span>
            </div>
          ))}
        </div>

        {reply.reasoning && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">AI Reasoning:</span> {reply.reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
