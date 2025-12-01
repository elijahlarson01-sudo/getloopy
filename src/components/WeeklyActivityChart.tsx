import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Zap } from "lucide-react";

interface DailyActivity {
  day: string;
  questions: number;
  correct: number;
}

interface WeeklyActivityChartProps {
  userId: string;
}

const WeeklyActivityChart = ({ userId }: WeeklyActivityChartProps) => {
  const [data, setData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyActivity = async () => {
      const today = new Date();
      const weekAgo = subDays(today, 6);

      const { data: attempts, error } = await supabase
        .from("user_question_attempts")
        .select("attempted_at, is_correct")
        .eq("user_id", userId)
        .gte("attempted_at", startOfDay(weekAgo).toISOString())
        .lte("attempted_at", endOfDay(today).toISOString());

      if (error) {
        console.error("Error fetching activity:", error);
        setLoading(false);
        return;
      }

      const dailyData: Record<string, DailyActivity> = {};
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayKey = format(date, "yyyy-MM-dd");
        dailyData[dayKey] = {
          day: format(date, "EEE"),
          questions: 0,
          correct: 0,
        };
      }

      attempts?.forEach((attempt) => {
        const dayKey = format(new Date(attempt.attempted_at), "yyyy-MM-dd");
        if (dailyData[dayKey]) {
          dailyData[dayKey].questions++;
          if (attempt.is_correct) {
            dailyData[dayKey].correct++;
          }
        }
      });

      setData(Object.values(dailyData));
      setLoading(false);
    };

    fetchWeeklyActivity();
  }, [userId]);

  if (loading) {
    return (
      <Card className="p-6 bg-accent">
        <div className="h-[200px] flex items-center justify-center">
          <p className="font-bold text-accent-foreground uppercase">Loading...</p>
        </div>
      </Card>
    );
  }

  const totalQuestions = data.reduce((sum, d) => sum + d.questions, 0);
  const totalCorrect = data.reduce((sum, d) => sum + d.correct, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-xl text-foreground">Weekly Activity</h3>
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase mt-1">
            {totalQuestions} questions • {accuracy}% accuracy
          </p>
        </div>
      </div>
      <div className="h-[200px]">
        {totalQuestions === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="font-bold text-muted-foreground">Complete lessons to see activity!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground))" strokeOpacity={0.2} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fontWeight: 700 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 2 }}
              />
              <YAxis
                tick={{ fontSize: 12, fontWeight: 700 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 2 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "4px solid hsl(var(--foreground))",
                  boxShadow: "4px 4px 0px hsl(var(--foreground))",
                  fontWeight: 700,
                }}
              />
              <Bar
                dataKey="questions"
                name="Questions"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                radius={0}
              />
              <Bar
                dataKey="correct"
                name="Correct"
                fill="hsl(var(--success))"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                radius={0}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default WeeklyActivityChart;
