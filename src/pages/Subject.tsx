import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Database, BarChart3, Code, Globe, CheckCircle2, Lock, Play } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  order_index: number;
  question_count: number;
}

interface ModuleProgress {
  is_completed: boolean;
  accuracy_percentage: number;
}

interface LevelGroup {
  level: string;
  emoji: string;
  modules: Module[];
  totalQuestions: number;
  isLocked: boolean;
}

const iconMap: Record<string, any> = {
  Database,
  BarChart3,
  Code,
  Globe,
};

const Subject = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      await fetchSubject();
      await fetchModules(session.user.id);
    };

    checkAuth();
  }, [navigate, subjectId]);

  const fetchSubject = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    if (error) {
      console.error("Error fetching subject:", error);
      return;
    }

    setSubject(data);
  };

  const fetchModules = async (userId: string) => {
    // Fetch all modules for this subject
    const { data: modulesData, error: modulesError } = await supabase
      .from("modules")
      .select("*")
      .eq("subject_id", subjectId)
      .order("order_index");

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      return;
    }

    setModules(modulesData || []);

    // Fetch user progress for these modules
    const { data: progressData, error: progressError } = await supabase
      .from("user_module_progress")
      .select("*")
      .eq("user_id", userId)
      .in("module_id", modulesData?.map(m => m.id) || []);

    if (progressError) {
      console.error("Error fetching progress:", progressError);
      return;
    }

    const progressMap: Record<string, ModuleProgress> = {};
    progressData?.forEach((p) => {
      progressMap[p.module_id] = {
        is_completed: p.is_completed,
        accuracy_percentage: p.accuracy_percentage,
      };
    });

    setModuleProgress(progressMap);
  };

  const groupModulesByLevel = (): LevelGroup[] => {
    const levels = {
      beginner: { level: "Beginner Level", emoji: "🟢", modules: [] as Module[], totalQuestions: 0 },
      intermediate: { level: "Intermediate Level", emoji: "🟡", modules: [] as Module[], totalQuestions: 0 },
      advanced: { level: "Advanced Level", emoji: "🔴", modules: [] as Module[], totalQuestions: 0 },
    };

    modules.forEach((module) => {
      const level = module.difficulty_level.toLowerCase() as keyof typeof levels;
      if (levels[level]) {
        levels[level].modules.push(module);
        levels[level].totalQuestions += module.question_count;
      }
    });

    // Check if beginner level is complete
    const beginnerComplete = levels.beginner.modules.length > 0 && 
      levels.beginner.modules.every(m => moduleProgress[m.id]?.is_completed);

    // Check if intermediate level is complete
    const intermediateComplete = levels.intermediate.modules.length > 0 &&
      levels.intermediate.modules.every(m => moduleProgress[m.id]?.is_completed);

    return [
      { ...levels.beginner, isLocked: false },
      { ...levels.intermediate, isLocked: !beginnerComplete },
      { ...levels.advanced, isLocked: !intermediateComplete },
    ].filter(group => group.modules.length > 0);
  };

  const handleModuleClick = (moduleId: string) => {
    console.log("Navigating to lesson:", moduleId);
    navigate(`/lesson/${moduleId}`);
  };

  if (!subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <header className="border-b border-border bg-card/50 backdrop-blur">
          <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
              Loop
            </h1>
          </div>
        </header>
        <main className="container max-w-6xl mx-auto px-4 py-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{subject.name}</h2>
          <p className="text-muted-foreground mb-6">No lessons available for this subject yet. Check back soon!</p>
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
        </main>
      </div>
    );
  }

  const IconComponent = iconMap[subject.icon] || Code;
  const levelGroups = groupModulesByLevel();
  const totalModules = modules.length;
  const totalQuestions = modules.reduce((sum, m) => sum + m.question_count, 0);
  const completedModules = Object.values(moduleProgress).filter(p => p.is_completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            Loop
          </h1>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${subject.color}/20 to-${subject.color}/10 flex items-center justify-center flex-shrink-0`}>
              <IconComponent className={`w-10 h-10 text-${subject.color}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-2">{subject.name}</h2>
              <p className="text-lg text-muted-foreground mb-4">{subject.description}</p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="text-sm">
                  {totalModules} lessons
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {totalQuestions} questions
                </Badge>
                {completedModules > 0 && (
                  <Badge variant="outline" className="text-sm bg-success/10 text-success border-success/30">
                    {completedModules} completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {completedModules > 0 && (
            <Card className="p-4 bg-card/50 backdrop-blur border-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-bold">{Math.round((completedModules / totalModules) * 100)}%</span>
              </div>
              <Progress value={(completedModules / totalModules) * 100} className="h-2" />
            </Card>
          )}
        </div>

        {/* Learning Roadmap */}
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-2">📚 Learning Roadmap</h3>
            <p className="text-muted-foreground mb-6">
              Your comprehensive {subject.name} curriculum with {totalModules} lessons organized by difficulty
            </p>
          </div>

          {levelGroups.map((group, groupIndex) => {
            const isLevelLocked = group.isLocked;
            
            return (
              <div key={group.level} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h4 className={`text-xl font-bold ${isLevelLocked ? 'text-muted-foreground' : ''}`}>
                    {group.emoji} {group.level}
                  </h4>
                  <Badge variant="outline" className={isLevelLocked ? 'opacity-60' : ''}>
                    {group.modules.length} lessons, {group.totalQuestions} questions
                  </Badge>
                  {isLevelLocked && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      <Lock className="w-3 h-3 mr-1" /> Locked
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3">
                  {group.modules.map((module, moduleIndex) => {
                    const progress = moduleProgress[module.id];
                    const isCompleted = progress?.is_completed || false;
                    const isPreviousCompleted = moduleIndex === 0 || 
                      moduleProgress[group.modules[moduleIndex - 1].id]?.is_completed ||
                      groupIndex > 0;
                    const isModuleLocked = isLevelLocked || !isPreviousCompleted;

                    return (
                      <Card
                        key={module.id}
                        className={`p-4 transition-all ${
                          isCompleted
                            ? "bg-success/10 border-success/30"
                            : !isModuleLocked
                            ? "bg-primary/5 border-primary/20 hover:border-primary/40 cursor-pointer hover:shadow-md"
                            : "bg-muted/30 border-border opacity-60"
                        }`}
                        onClick={() => !isModuleLocked && handleModuleClick(module.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? "bg-success"
                                : !isModuleLocked
                                ? "bg-gradient-to-br from-primary to-primary-light"
                                : "bg-muted"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-success-foreground" />
                            ) : !isModuleLocked ? (
                              <Play className="w-6 h-6 text-primary-foreground" />
                            ) : (
                              <Lock className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-foreground">{module.title}</h5>
                            <p className="text-sm text-muted-foreground">
                              {module.description || `${module.question_count} practice questions`}
                            </p>
                            {isCompleted && progress && (
                              <p className="text-sm text-success mt-1">
                                Completed • {progress.accuracy_percentage}% accuracy
                              </p>
                            )}
                            {isModuleLocked && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {isLevelLocked 
                                  ? "Complete previous level to unlock"
                                  : "Complete previous lesson to unlock"}
                              </p>
                            )}
                          </div>
                          {!isModuleLocked && !isCompleted && (
                            <Button size="sm" variant="gradient">
                              Start
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Subject;
