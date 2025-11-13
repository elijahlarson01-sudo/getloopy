import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Database, BarChart3, Code, Globe } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
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

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      fetchSubject();
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

  if (!subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const IconComponent = iconMap[subject.icon] || Code;

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
        <div className="mb-8 flex items-start gap-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${subject.color}/20 to-${subject.color}/10 flex items-center justify-center flex-shrink-0`}>
            <IconComponent className={`w-10 h-10 text-${subject.color}`} />
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-2">{subject.name}</h2>
            <p className="text-lg text-muted-foreground">{subject.description}</p>
          </div>
        </div>

        <Card className="p-12 text-center bg-card/50 backdrop-blur border-2">
          <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            Lessons and practice modules for {subject.name} are currently being
            developed. Check back soon!
          </p>
          <Button variant="gradient" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Subject;
