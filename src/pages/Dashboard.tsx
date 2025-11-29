import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Flame, Brain, LogOut, Database, BarChart3, Code, Globe } from "lucide-react";
import type { User } from "@supabase/supabase-js";
interface UserProgress {
  current_streak: number;
  mastery_points: number;
  weekly_mastery_points: number;
}
interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}
interface SubjectProgress {
  mastery_level: number;
  lessons_completed: number;
  accuracy_percentage: number;
}
const iconMap: Record<string, any> = {
  Database,
  BarChart3,
  Code,
  Globe
};
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<Record<string, SubjectProgress>>({});
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchUserData(session.user.id);
    };
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });
    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);
  const fetchUserData = async (userId: string) => {
    // Fetch user progress
    let {
      data: progress,
      error: progressError
    } = await supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle();
    if (progressError && progressError.code !== "PGRST116") {
      console.error("Error fetching progress:", progressError);
    }

    // If no progress exists, create it
    if (!progress) {
      const {
        data: newProgress,
        error: insertError
      } = await supabase.from("user_progress").insert({
        user_id: userId,
        current_streak: 0,
        mastery_points: 0,
        weekly_mastery_points: 0
      }).select().single();
      if (insertError) {
        console.error("Error creating progress:", insertError);
      } else {
        progress = newProgress;
      }
    }
    setUserProgress(progress);

    // Fetch all subjects
    const {
      data: subjectsData,
      error: subjectsError
    } = await supabase.from("subjects").select("*").order("name");
    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError);
      return;
    }
    setSubjects(subjectsData || []);

    // Fetch user subject progress
    const {
      data: progressData,
      error: subjectProgressError
    } = await supabase.from("user_subject_progress").select("*").eq("user_id", userId);
    if (subjectProgressError) {
      console.error("Error fetching subject progress:", subjectProgressError);
      return;
    }
    const progressMap: Record<string, SubjectProgress> = {};
    progressData?.forEach(p => {
      progressMap[p.subject_id] = {
        mastery_level: p.mastery_level,
        lessons_completed: p.lessons_completed,
        accuracy_percentage: p.accuracy_percentage
      };
    });
    setSubjectProgress(progressMap);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out."
    });
    navigate("/");
  };
  const handleSubjectClick = (subjectId: string) => {
    navigate(`/subject/${subjectId}`);
  };
  if (!user || !userProgress) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            Loop
          </h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">What took you so long?!  Click a few subjects below to test your skills  - Eli            </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-8 bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Streak
                </p>
                <h3 className="text-5xl font-black text-foreground mt-1">
                  {userProgress.current_streak}
                </h3>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
                <Flame className="w-16 h-16 text-accent relative z-10" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep practicing to maintain your streak!
            </p>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Weekly Points
                </p>
                <h3 className="text-5xl font-black text-foreground mt-1">
                  {userProgress.weekly_mastery_points || 0}
                </h3>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Brain className="w-16 h-16 text-primary relative z-10" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Resets every Monday • Total: {userProgress.mastery_points} pts
            </p>
          </Card>
        </div>

        {/* Subjects */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Your Subjects</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {subjects.map(subject => {
            const IconComponent = iconMap[subject.icon] || Code;
            const progress = subjectProgress[subject.id];
            const masteryLevel = progress?.mastery_level || 0;
            const lessonsCompleted = progress?.lessons_completed || 0;
            const accuracy = progress?.accuracy_percentage || 0;
            return <Card key={subject.id} className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/30 cursor-pointer" onClick={() => handleSubjectClick(subject.id)}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${subject.color}/20 to-${subject.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`w-6 h-6 text-${subject.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-bold mb-1">{subject.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {subject.description}
                      </p>
                      {progress ? <>
                          <Progress value={masteryLevel} className="h-2 mb-2" />
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Level {masteryLevel}</span>
                            <span>•</span>
                            <span>{lessonsCompleted} lessons</span>
                            <span>•</span>
                            <span>{accuracy}% accuracy</span>
                          </div>
                        </> : <p className="text-sm text-muted-foreground">
                          Start learning →
                        </p>}
                    </div>
                  </div>
                </Card>;
          })}
          </div>
        </div>
      </main>
    </div>;
};
export default Dashboard;