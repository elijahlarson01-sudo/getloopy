import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Flame, Brain, LogOut, Database, BarChart3, Code, Globe, BookOpen, Palette, Calculator, Leaf, TrendingUp, Menu, Settings, GraduationCap, Pencil, Atom, Lightbulb, FlaskConical, MousePointerClick, Megaphone, Cog, ShoppingCart, Target, Truck, Brush, Dna, BookMarked, Pi, Zap, Languages, User as UserIcon, Swords, Shield } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import WeeklyActivityChart from "@/components/WeeklyActivityChart";
import SubjectBreakdownChart from "@/components/SubjectBreakdownChart";
import CohortLeaderboard from "@/components/CohortLeaderboard";
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
  Globe,
  BookOpen,
  Palette,
  Calculator,
  Leaf,
  TrendingUp,
  Atom,
  Lightbulb,
  FlaskConical,
  MousePointerClick,
  Megaphone,
  Cog,
  ShoppingCart,
  Target,
  Truck,
  Brush,
  Dna,
  BookMarked,
  Pi,
  Zap,
  Languages
};
const Dashboard = () => {
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<Record<string, SubjectProgress>>({});
  const [userName, setUserName] = useState<string>("");
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const { isAdmin } = useAdminCheck();
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

      // Check if onboarding completed
      const {
        data: onboarding
      } = await supabase.from("user_onboarding").select("onboarding_completed").eq("user_id", session.user.id).maybeSingle();
      if (!onboarding?.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      setUser(session.user);
      await fetchUserData(session.user.id);
      await fetchUserName(session.user.id);
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

    // Fetch user's selected subject interests
    const {
      data: interests,
      error: interestsError
    } = await supabase.from("user_subject_interests").select("interest_category").eq("user_id", userId);
    if (interestsError) {
      console.error("Error fetching interests:", interestsError);
    }
    const selectedInterests = interests?.map(i => i.interest_category) || [];

    // Fetch all subjects
    const {
      data: subjectsData,
      error: subjectsError
    } = await supabase.from("subjects").select("*").order("name");
    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError);
      return;
    }

    // Filter subjects to only show user's selected interests (match by name OR id)
    const filteredSubjects = selectedInterests.length > 0 ? subjectsData?.filter(s => selectedInterests.includes(s.name) || selectedInterests.includes(s.id)) || [] : subjectsData || [];
    setSubjects(filteredSubjects);

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
  const fetchUserName = async (userId: string) => {
    const {
      data: profile
    } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    if (profile?.full_name) {
      setUserName(profile.full_name);
    }
  };
  const handleSaveName = async () => {
    if (!user || !editingName.trim()) return;
    setSavingName(true);
    const {
      error
    } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: editingName.trim(),
      email: user.email
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save name",
        variant: "destructive"
      });
    } else {
      setUserName(editingName.trim());
      setEditNameOpen(false);
      toast({
        title: "Name updated",
        description: "Your display name has been updated."
      });
    }
    setSavingName(false);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {
              setEditingName(userName);
              setEditNameOpen(true);
            }}>
                <UserIcon className="w-4 h-4 mr-2" />
                Edit Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/challenges")}>
                <Swords className="w-4 h-4 mr-2" />
                Challenges
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/onboarding?edit=true")}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Preferences
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h2>
          <p className="text-muted-foreground">What took you so long?! Click a few subjects below to test your skills</p>
        </div>

        {/* Edit Name Dialog */}
        <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Your Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" value={editingName} onChange={e => setEditingName(e.target.value)} placeholder="Enter your name" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditNameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveName} disabled={savingName || !editingName.trim()}>
                {savingName ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Analytics Charts & Leaderboard */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <WeeklyActivityChart userId={user.id} />
          <SubjectBreakdownChart subjects={subjects} subjectProgress={subjectProgress} />
          <CohortLeaderboard userId={user.id} />
        </div>

        {/* Subjects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Your Subjects</h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/onboarding?edit=true&step=subjects")} className="gap-2">
              <Pencil className="w-4 h-4" />
              Edit Subjects
            </Button>
          </div>
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