import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { ReplyMotivation } from "@shared/schema";

interface MotivationPieChartProps {
  motivations: Record<string, number>;
}

const MOTIVATION_COLORS: Record<string, string> = {
  agreement: "#22c55e",    // green
  curiosity: "#3b82f6",    // blue
  criticism: "#f97316",    // orange
  promotion: "#a855f7",    // purple
  humor: "#eab308",        // yellow
  trolling: "#ef4444",     // red
  community: "#14b8a6",    // teal
  information: "#6366f1",  // indigo
};

const MOTIVATION_LABELS: Record<string, string> = {
  agreement: "Agreement",
  curiosity: "Curiosity",
  criticism: "Criticism",
  promotion: "Promotion",
  humor: "Humor",
  trolling: "Trolling",
  community: "Community",
  information: "Information",
};

export function MotivationPieChart({ motivations }: MotivationPieChartProps) {
  const data = Object.entries(motivations)
    .filter(([_, count]) => count > 0)
    .map(([motivation, count]) => ({
      name: MOTIVATION_LABELS[motivation] || motivation,
      value: count,
      color: MOTIVATION_COLORS[motivation] || "#94a3b8",
    }));

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
        No motivation data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} replies`, ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function getMotivationCounts(replies: Array<{ motivation?: string | null }>): Record<string, number> {
  const counts: Record<string, number> = {
    agreement: 0,
    curiosity: 0,
    criticism: 0,
    promotion: 0,
    humor: 0,
    trolling: 0,
    community: 0,
    information: 0,
  };

  for (const reply of replies) {
    if (reply.motivation && counts.hasOwnProperty(reply.motivation)) {
      counts[reply.motivation]++;
    }
  }

  return counts;
}

export function getSocialInteractionsSummary(
  replies: Array<{ motivation?: string | null; category: string }>,
  motivationCounts: Record<string, number>
): { positive: string[]; negative: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];

  const total = replies.length;
  if (total === 0) return { positive, negative };

  // Positive interactions
  const agreementPct = Math.round((motivationCounts.agreement / total) * 100);
  const communityPct = Math.round((motivationCounts.community / total) * 100);
  const informationPct = Math.round((motivationCounts.information / total) * 100);
  const curiosityPct = Math.round((motivationCounts.curiosity / total) * 100);

  if (agreementPct > 20) {
    positive.push(`Strong agreement: ${agreementPct}% of replies show support for the post`);
  } else if (agreementPct > 0) {
    positive.push(`${motivationCounts.agreement} replies express agreement or support`);
  }

  if (communityPct > 10) {
    positive.push(`Active community building: ${communityPct}% foster connections`);
  } else if (motivationCounts.community > 0) {
    positive.push(`${motivationCounts.community} replies focus on community building`);
  }

  if (informationPct > 15) {
    positive.push(`Knowledge sharing: ${informationPct}% contribute useful information`);
  } else if (motivationCounts.information > 0) {
    positive.push(`${motivationCounts.information} replies share helpful information`);
  }

  if (curiosityPct > 15) {
    positive.push(`Engaged audience: ${curiosityPct}% ask questions or seek clarity`);
  }

  // Negative interactions
  const trollingPct = Math.round((motivationCounts.trolling / total) * 100);
  const promotionPct = Math.round((motivationCounts.promotion / total) * 100);
  const criticismPct = Math.round((motivationCounts.criticism / total) * 100);

  if (trollingPct > 20) {
    negative.push(`High trolling activity: ${trollingPct}% of replies are provocative or disruptive`);
  } else if (motivationCounts.trolling > 0) {
    negative.push(`${motivationCounts.trolling} replies show trolling or provocative behavior`);
  }

  if (promotionPct > 15) {
    negative.push(`Spam concern: ${promotionPct}% are self-promotional or advertising`);
  } else if (motivationCounts.promotion > 0) {
    negative.push(`${motivationCounts.promotion} replies contain promotional content`);
  }

  if (criticismPct > 30) {
    negative.push(`Controversial: ${criticismPct}% of replies are critical or disagreeing`);
  } else if (motivationCounts.criticism > 2) {
    negative.push(`${motivationCounts.criticism} replies express criticism or disagreement`);
  }

  // Cohesive vs spam summary
  const cohesiveCount = replies.filter(r => r.category === "cohesive_helpful").length;
  const spamCount = replies.filter(r => r.category === "argumentative_spam").length;
  const cohesivePct = Math.round((cohesiveCount / total) * 100);
  
  if (cohesivePct >= 80) {
    positive.push(`Highly constructive discussion: ${cohesivePct}% of replies are helpful`);
  } else if (cohesivePct >= 60) {
    positive.push(`Generally positive discourse: ${cohesivePct}% cohesive replies`);
  }

  if (spamCount > cohesiveCount) {
    negative.push(`Warning: More spam/argumentative replies than helpful ones`);
  }

  return { positive, negative };
}
