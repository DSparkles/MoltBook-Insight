import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryPieChartProps {
  cohesive: number;
  spam: number;
}

export function CategoryPieChart({ cohesive, spam }: CategoryPieChartProps) {
  const data = [
    { name: "Cohesive & Helpful", value: cohesive, color: "hsl(142, 76%, 36%)" },
    { name: "Spam & Argumentative", value: spam, color: "hsl(0, 84%, 48%)" },
  ];

  const total = cohesive + spam;
  if (total === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No data available
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
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} (${Math.round((value / total) * 100)}%)`, ""]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
