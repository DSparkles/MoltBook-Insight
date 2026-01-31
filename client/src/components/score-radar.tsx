import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ReplyScores } from "@shared/schema";

interface ScoreRadarProps {
  scores: ReplyScores;
}

const dimensionShortLabels: Record<string, string> = {
  cooperativeIntent: "Cooperative",
  communicationClarity: "Clarity",
  knowledgeSharing: "Knowledge",
  ethicalConsideration: "Ethics",
  humanAlignment: "Alignment",
};

export function ScoreRadar({ scores }: ScoreRadarProps) {
  const data = Object.entries(scores).map(([key, value]) => ({
    dimension: dimensionShortLabels[key] || key,
    score: value,
    fullMark: 7,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 7]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickCount={4}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(value: number) => [value.toFixed(1), "Score"]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "6px",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
