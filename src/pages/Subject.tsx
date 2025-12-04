import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      beginner: { level: "Beginner Level", emoji: "●", modules: [] as Module[], totalQuestions: 0 },
      intermediate: { level: "Intermediate Level", emoji: "●●", modules: [] as Module[], totalQuestions: 0 },
      advanced: { level: "Advanced Level", emoji: "●●●", modules: [] as Module[], totalQuestions: 0 },
    };

    modules.forEach((module) => {
      const level = module.difficulty_level.toLowerCase() as keyof typeof levels;
      if (levels[level]) {
        levels[level].modules.push(module);
        levels[level].totalQuestions += module.question_count;
      }
    });

    const beginnerComplete = levels.beginner.modules.length > 0 && 
      levels.beginner.modules.every(m => moduleProgress[m.id]?.is_completed);

    const intermediateComplete = levels.intermediate.modules.length > 0 &&
      levels.intermediate.modules.every(m => moduleProgress[m.id]?.is_completed);

    return [
      { ...levels.beginner, isLocked: false },
      { ...levels.intermediate, isLocked: !beginnerComplete },
      { ...levels.advanced, isLocked: !intermediateComplete },
    ].filter(group => group.modules.length > 0);
  };

  const handleModuleClick = (moduleId: string) => {
    navigate(`/lesson/${moduleId}`);
  };

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="doodle-box p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[subject.icon] || Code;
  const levelGroups = groupModulesByLevel();
  const totalModules = modules.length;
  const totalQuestions = modules.reduce((sum, m) => sum + m.question_count, 0);
  const completedModules = Object.values(moduleProgress).filter(p => p.is_completed).length;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-40" />

      <header className="border-b-2 border-foreground bg-background relative z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="font-display text-2xl text-foreground">
            Loop
          </h1>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-16 h-16 border-2 border-foreground rounded-xl flex items-center justify-center flex-shrink-0 sketch-hover">
              <IconComponent className="w-8 h-8 text-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-4xl mb-2">{subject.name}</h2>
              <p className="text-lg text-muted-foreground mb-4">{subject.description}</p>
              <div className="flex flex-wrap gap-3">
                <span className="sketch-card px-3 py-1 text-sm">
                  {totalModules} lessons
                </span>
                <span className="sketch-card px-3 py-1 text-sm">
                  {totalQuestions} questions
                </span>
                {completedModules > 0 && (
                  <span className="sketch-card px-3 py-1 text-sm bg-foreground text-background">
                    {completedModules} completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {completedModules > 0 && (
            <div className="sketch-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-semibold">{Math.round((completedModules / totalModules) * 100)}%</span>
              </div>
              <div className="h-2 bg-secondary border border-foreground rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground transition-all rounded-full"
                  style={{ width: `${(completedModules / totalModules) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Learning Roadmap */}
        <div className="space-y-8">
          <div>
            <h3 className="font-display text-2xl mb-2">Learning Roadmap</h3>
            <p className="text-muted-foreground mb-6">
              Your comprehensive {subject.name} curriculum with {totalModules} lessons organized by difficulty
            </p>
          </div>

          {levelGroups.map((group, groupIndex) => {
            const isLevelLocked = group.isLocked;
            
            return (
              <div key={group.level} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h4 className={`font-display text-xl ${isLevelLocked ? 'text-muted-foreground' : ''}`}>
                    {group.emoji} {group.level}
                  </h4>
                  <span className={`text-sm text-muted-foreground ${isLevelLocked ? 'opacity-60' : ''}`}>
                    {group.modules.length} lessons, {group.totalQuestions} questions
                  </span>
                  {isLevelLocked && (
                    <span className="sketch-card px-2 py-1 text-xs flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
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
                      <div
                        key={module.id}
                        className={`sketch-card p-4 transition-all ${
                          isCompleted
                            ? "bg-foreground text-background"
                            : !isModuleLocked
                            ? "hover:shadow-sketch hover:-translate-x-1 hover:-translate-y-1 cursor-pointer"
                            : "opacity-50"
                        }`}
                        onClick={() => !isModuleLocked && handleModuleClick(module.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border-2 ${
                              isCompleted
                                ? "border-background bg-background"
                                : !isModuleLocked
                                ? "border-foreground"
                                : "border-foreground/50"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-foreground" />
                            ) : !isModuleLocked ? (
                              <Play className="w-5 h-5 text-foreground" />
                            ) : (
                              <Lock className="w-5 h-5 text-foreground/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold">{module.title}</h5>
                            <p className={`text-sm ${isCompleted ? 'opacity-70' : 'text-muted-foreground'}`}>
                              {module.description || `${module.question_count} practice questions`}
                            </p>
                            {isCompleted && progress && (
                              <p className="text-sm mt-1 opacity-70">
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
                            <Button size="sm" variant="default">
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
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