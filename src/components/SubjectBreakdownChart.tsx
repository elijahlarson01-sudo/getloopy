import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Target } from "lucide-react";

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
  "hsl(var(--pink))",
  "hsl(var(--orange))",
  "hsl(var(--secondary))",
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
      <Card className="p-6 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-pink" />
          <h3 className="font-display text-xl text-foreground">Subject Breakdown</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <p className="font-bold text-muted-foreground">Complete lessons to see breakdown!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-pink" />
          <h3 className="font-display text-xl text-foreground">Subject Breakdown</h3>
        </div>
        <p className="text-sm font-bold text-muted-foreground uppercase mt-1">
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
              innerRadius={45}
              outerRadius={65}
              paddingAngle={4}
              dataKey="lessons"
              nameKey="name"
              stroke="hsl(var(--foreground))"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "4px solid hsl(var(--foreground))",
                boxShadow: "4px 4px 0px hsl(var(--foreground))",
                fontWeight: 700,
              }}
              formatter={(value: number, name: string) => [`${value} lessons`, name]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm font-bold text-foreground uppercase">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SubjectBreakdownChart;
