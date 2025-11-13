import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  question_count: number;
  subject_id: string;
}

const Lesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      fetchModule();
    };

    checkAuth();
  }, [navigate, lessonId]);

  const fetchModule = async () => {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (error) {
      console.error("Error fetching module:", error);
      return;
    }

    setModule(data);
  };

  const handleBack = () => {
    if (module) {
      navigate(`/subject/${module.subject_id}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Roadmap
          </Button>
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            Loop
          </h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">
            {module.difficulty_level} Level
          </div>
          <h2 className="text-4xl font-bold mb-4">{module.title}</h2>
          <p className="text-lg text-muted-foreground">
            {module.description || `Practice with ${module.question_count} questions`}
          </p>
        </div>

        <Card className="p-12 text-center bg-card/50 backdrop-blur border-2">
          <h3 className="text-2xl font-bold mb-4">Practice Mode Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Interactive practice sessions with {module.question_count} questions are being developed
            for this lesson. You'll be able to test your knowledge with multiple choice,
            fill-in-the-blank, and code challenges.
          </p>
          <Button variant="gradient" onClick={handleBack}>
            Back to Roadmap
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Lesson;
