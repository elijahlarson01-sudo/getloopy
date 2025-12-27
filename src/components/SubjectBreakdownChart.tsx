import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface SubjectData {
  name: string;
  lessons: number;
  color: string;
}

interface SubjectBreakdownChartProps {
  subjects: Array<{ id: string; name: string; color: string }>;
  subjectProgress: Record<string, { lessons_completed: number }>;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(82, 25%, 55%)",
  "hsl(38, 50%, 60%)",
  "hsl(200, 60%, 50%)",
];

const SubjectBreakdownChart = ({ subjects, subjectProgress }: SubjectBreakdownChartProps) => {
  const data: SubjectData[] = subjects
    .map((subject, index) => ({
      name: subject.name,
      lessons: subjectProgress[subject.id]?.lessons_completed || 0,
      color: COLORS[index % COLORS.length],
    }))
    .filter((d) => d.lessons > 0);

  const totalLessons = data.reduce((sum, d) => sum + d.lessons, 0);

  if (totalLessons === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-accent/5 via-accent/[0.02] to-transparent border border-border/50 shadow-sm h-full">
        <h3 className="text-lg font-bold mb-4">Subject Breakdown</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          <p>Complete lessons to see your breakdown!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-accent/5 via-accent/[0.02] to-transparent border border-border/50 shadow-sm h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold">Subject Breakdown</h3>
        <p className="text-sm text-muted-foreground">
          {totalLessons} lessons completed
        </p>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="lessons"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number, name: string) => [`${value} lessons`, name]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SubjectBreakdownChart;
