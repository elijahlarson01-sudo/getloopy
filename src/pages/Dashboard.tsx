import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Flame, Brain, LogOut, Database, BarChart3, Code, Globe, BookOpen, Palette, Calculator, Leaf, TrendingUp, Menu, Settings, GraduationCap, Pencil, Atom, Lightbulb, FlaskConical, MousePointerClick, Megaphone, Cog, ShoppingCart, Target, Truck, Brush, Dna, BookMarked, Pi, Zap, Languages, User as UserIcon, Star, Sparkles } from "lucide-react";
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

const colorMap: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  pink: "bg-pink text-pink-foreground",
  orange: "bg-orange text-orange-foreground",
  secondary: "bg-secondary text-secondary-foreground",
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

  const getSubjectColor = (index: number) => {
    const colors = ["primary", "accent", "success", "pink", "orange", "secondary"];
    return colors[index % colors.length];
  };

  if (!user || !userProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center radiant-bg">
        <div className="pop-card bg-card p-8 animate-bounce-in">
          <p className="font-bold text-foreground uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background radiant-bg relative">
      {/* Decorative shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-10 h-10 bg-primary border-4 border-foreground rounded-full dance" />
        <div className="absolute top-40 left-10 w-8 h-8 bg-secondary border-4 border-foreground rotate-45 dance" style={{ animationDelay: '0.2s' }} />
        <div className="absolute bottom-40 right-20 w-6 h-6 bg-accent border-4 border-foreground dance" style={{ animationDelay: '0.3s' }} />
        <div className="absolute bottom-20 left-16 w-8 h-8 bg-pink border-4 border-foreground rounded-full dance" style={{ animationDelay: '0.4s' }} />
      </div>

      <header className="border-b-4 border-foreground bg-card relative z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-display text-4xl text-foreground tracking-wide">
            LOOP
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-4 border-foreground shadow-pop">
              <DropdownMenuItem onClick={() => { setEditingName(userName); setEditNameOpen(true); }} className="font-bold">
                <UserIcon className="w-4 h-4 mr-2" />
                Edit Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/onboarding?edit=true")} className="font-bold">
                <Settings className="w-4 h-4 mr-2" />
                Edit Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground h-0.5" />
              <DropdownMenuItem onClick={handleLogout} className="font-bold">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <div className="inline-block relative">
            <h2 className="font-display text-4xl md:text-5xl text-foreground">
              Welcome back{userName ? `, ${userName}` : ""}!
            </h2>
            <Star className="absolute -top-2 -right-6 w-6 h-6 text-secondary fill-secondary animate-wiggle" />
          </div>
          <p className="font-marker text-lg text-foreground mt-2 rotate-[-1deg]">
            What took you so long?! Click a subject below!
          </p>
        </div>

        {/* Edit Name Dialog */}
        <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
          <DialogContent className="border-4 border-foreground shadow-pop">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Edit Your Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold uppercase">Display Name</Label>
                <Input 
                  id="name" 
                  value={editingName} 
                  onChange={e => setEditingName(e.target.value)} 
                  placeholder="Enter your name"
                  className="border-4 border-foreground shadow-pop-sm h-12 font-semibold"
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
          <div className="pop-card bg-secondary p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold uppercase text-sm text-secondary-foreground/80">
                  Current Streak
                </p>
                <h3 className="font-display text-6xl text-secondary-foreground mt-1">
                  {userProgress.current_streak}
                </h3>
              </div>
              <div className="w-20 h-20 bg-card border-4 border-foreground flex items-center justify-center bounce-hover">
                <Flame className="w-10 h-10 text-orange" />
              </div>
            </div>
            <p className="font-semibold text-secondary-foreground/80">
              Keep practicing to maintain your streak!
            </p>
          </div>

          <div className="pop-card bg-primary p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold uppercase text-sm text-primary-foreground/80">
                  Weekly Points
                </p>
                <h3 className="font-display text-6xl text-primary-foreground mt-1">
                  {userProgress.weekly_mastery_points || 0}
                </h3>
              </div>
              <div className="w-20 h-20 bg-card border-4 border-foreground flex items-center justify-center bounce-hover">
                <Brain className="w-10 h-10 text-accent" />
              </div>
            </div>
            <p className="font-semibold text-primary-foreground/80">
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
            <div className="relative inline-block">
              <h3 className="font-display text-3xl text-foreground">Your Subjects</h3>
              <Sparkles className="absolute -top-1 -right-5 w-5 h-5 text-pink fill-pink animate-wiggle" />
            </div>
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
              const colorClass = getSubjectColor(index);

              return (
                <div
                  key={subject.id}
                  className={`pop-card p-6 cursor-pointer ${colorMap[colorClass]}`}
                  onClick={() => handleSubjectClick(subject.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-card border-4 border-foreground flex items-center justify-center flex-shrink-0 bounce-hover">
                      <IconComponent className="w-7 h-7 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-2xl">{subject.name}</h4>
                      <p className="text-sm font-semibold opacity-80 mb-3">
                        {subject.description}
                      </p>
                      {progress ? (
                        <>
                          <div className="h-3 bg-card border-2 border-foreground overflow-hidden mb-2">
                            <div 
                              className="h-full bg-foreground transition-all"
                              style={{ width: `${masteryLevel}%` }}
                            />
                          </div>
                          <div className="flex gap-3 text-xs font-bold uppercase opacity-80">
                            <span>Lvl {masteryLevel}</span>
                            <span>•</span>
                            <span>{lessonsCompleted} lessons</span>
                            <span>•</span>
                            <span>{accuracy}% acc</span>
                          </div>
                        </>
                      ) : (
                        <p className="font-bold uppercase">
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
