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

      // Initialize all 7 days
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

      // Aggregate attempts by day
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
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-border/50 shadow-sm h-full">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading activity...</p>
        </div>
      </Card>
    );
  }

  const totalQuestions = data.reduce((sum, d) => sum + d.questions, 0);
  const totalCorrect = data.reduce((sum, d) => sum + d.correct, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-border/50 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Weekly Activity</h3>
          <p className="text-sm text-muted-foreground">
            {totalQuestions} questions • {accuracy}% accuracy
          </p>
        </div>
      </div>
      <div className="h-[200px]">
        {totalQuestions === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>Complete some lessons to see your activity!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar
                dataKey="questions"
                name="Questions"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="correct"
                name="Correct"
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default WeeklyActivityChart;
