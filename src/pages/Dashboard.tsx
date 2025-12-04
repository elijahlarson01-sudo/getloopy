import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Flame, Brain, LogOut, Database, BarChart3, Code, Globe, BookOpen, Palette, Calculator, Leaf, TrendingUp, Menu, Settings, GraduationCap, Pencil, Atom, Lightbulb, FlaskConical, MousePointerClick, Megaphone, Cog, ShoppingCart, Target, Truck, Brush, Dna, BookMarked, Pi, Zap, Languages, User as UserIcon, Star } from "lucide-react";
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
  const [user, setUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<Record<string, SubjectProgress>>({});
  const [userName, setUserName] = useState<string>("");
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: onboarding } = await supabase.from("user_onboarding").select("onboarding_completed").eq("user_id", session.user.id).maybeSingle();
      if (!onboarding?.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      setUser(session.user);
      await fetchUserData(session.user.id);
      await fetchUserName(session.user.id);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    let { data: progress, error: progressError } = await supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle();
    if (progressError && progressError.code !== "PGRST116") {
      console.error("Error fetching progress:", progressError);
    }

    if (!progress) {
      const { data: newProgress, error: insertError } = await supabase.from("user_progress").insert({
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

    const { data: interests, error: interestsError } = await supabase.from("user_subject_interests").select("interest_category").eq("user_id", userId);
    if (interestsError) {
      console.error("Error fetching interests:", interestsError);
    }
    const selectedInterests = interests?.map(i => i.interest_category) || [];

    const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("*").order("name");
    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError);
      return;
    }

    const filteredSubjects = selectedInterests.length > 0 ? subjectsData?.filter(s => selectedInterests.includes(s.name) || selectedInterests.includes(s.id)) || [] : subjectsData || [];
    setSubjects(filteredSubjects);

    const { data: progressData, error: subjectProgressError } = await supabase.from("user_subject_progress").select("*").eq("user_id", userId);
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
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    if (profile?.full_name) {
      setUserName(profile.full_name);
    }
  };

  const handleSaveName = async () => {
    if (!user || !editingName.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: editingName.trim(),
      email: user.email
    });
    if (error) {
      toast({ title: "Error", description: "Failed to save name", variant: "destructive" });
    } else {
      setUserName(editingName.trim());
      setEditNameOpen(false);
      toast({ title: "Name updated", description: "Your display name has been updated." });
    }
    setSavingName(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You've been successfully signed out." });
    navigate("/");
  };

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/subject/${subjectId}`);
  };

  if (!user || !userProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="doodle-box p-8">
          <p className="font-semibold text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-40" />
      
      {/* Decorative doodles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-10 h-10 border-2 border-foreground rounded-full float opacity-15" />
        <div className="absolute top-40 left-10 w-8 h-8 border-2 border-foreground rotate-45 float opacity-15" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 right-20 w-6 h-6 border-2 border-foreground rounded-lg float opacity-15" style={{ animationDelay: '2s' }} />
      </div>

      <header className="border-b-2 border-foreground bg-background relative z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-display text-3xl text-foreground">
            Loop
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-2 border-foreground shadow-sketch">
              <DropdownMenuItem onClick={() => { setEditingName(userName); setEditNameOpen(true); }} className="font-medium">
                <UserIcon className="w-4 h-4 mr-2" />
                Edit Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/onboarding?edit=true")} className="font-medium">
                <Settings className="w-4 h-4 mr-2" />
                Edit Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/20" />
              <DropdownMenuItem onClick={handleLogout} className="font-medium">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h2 className="font-display text-4xl md:text-5xl text-foreground">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h2>
          <p className="font-sketch text-xl text-muted-foreground mt-2">
            What took you so long?! Click a subject below!
          </p>
        </div>

        {/* Edit Name Dialog */}
        <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
          <DialogContent className="border-2 border-foreground shadow-sketch">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Edit Your Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">Display Name</Label>
                <Input 
                  id="name" 
                  value={editingName} 
                  onChange={e => setEditingName(e.target.value)} 
                  placeholder="Enter your name"
                  className="border-2 border-foreground shadow-sketch-sm h-11"
                />
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
          <div className="doodle-box p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Current Streak
                </p>
                <h3 className="font-display text-5xl text-foreground mt-1">
                  {userProgress.current_streak}
                </h3>
              </div>
              <div className="w-16 h-16 border-2 border-foreground rounded-xl flex items-center justify-center sketch-hover">
                <Flame className="w-8 h-8 text-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep practicing to maintain your streak!
            </p>
          </div>

          <div className="doodle-box p-6 bg-foreground text-background">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-70 font-medium">
                  Weekly Points
                </p>
                <h3 className="font-display text-5xl mt-1">
                  {userProgress.weekly_mastery_points || 0}
                </h3>
              </div>
              <div className="w-16 h-16 border-2 border-background rounded-xl flex items-center justify-center bg-background sketch-hover">
                <Brain className="w-8 h-8 text-foreground" />
              </div>
            </div>
            <p className="text-sm opacity-70">
              Resets every Monday • Total: {userProgress.mastery_points} pts
            </p>
          </div>
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
            <h3 className="font-display text-2xl text-foreground">Your Subjects</h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/onboarding?edit=true&step=subjects")} className="gap-2">
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {subjects.map((subject, index) => {
              const IconComponent = iconMap[subject.icon] || Code;
              const progress = subjectProgress[subject.id];
              const masteryLevel = progress?.mastery_level || 0;
              const lessonsCompleted = progress?.lessons_completed || 0;
              const accuracy = progress?.accuracy_percentage || 0;

              return (
                <div
                  key={subject.id}
                  className={`sketch-card p-5 cursor-pointer hover:shadow-sketch hover:-translate-x-1 hover:-translate-y-1 transition-all ${
                    index % 2 === 0 ? 'tilt-1' : 'tilt-2'
                  }`}
                  onClick={() => handleSubjectClick(subject.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 border-2 border-foreground rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-xl">{subject.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {subject.description}
                      </p>
                      {progress ? (
                        <>
                          <div className="h-2 bg-secondary border border-foreground rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-foreground transition-all rounded-full"
                              style={{ width: `${masteryLevel}%` }}
                            />
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Lvl {masteryLevel}</span>
                            <span>•</span>
                            <span>{lessonsCompleted} lessons</span>
                            <span>•</span>
                            <span>{accuracy}% acc</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-foreground">
                          Start learning →
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;