import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Flame, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MOTIVATIONS = [
  { id: "quick-learning", label: "Quick Learning", icon: "⚡" },
  { id: "degree-support", label: "Degree Support", icon: "🎓" },
  { id: "career-advancement", label: "Career Advancement", icon: "📈" },
  { id: "personal-interest", label: "Personal Interest", icon: "💡" },
];

const INTERESTS = [
  { id: "programming", label: "Computer Programming", icon: "💻" },
  { id: "data-science", label: "Data Science & Analytics", icon: "📊" },
  { id: "history", label: "History", icon: "📜" },
  { id: "medicine", label: "Medicine & Health", icon: "🏥" },
  { id: "math", label: "Mathematics", icon: "🔢" },
  { id: "languages", label: "Languages", icon: "🌍" },
  { id: "business", label: "Business & Finance", icon: "💼" },
  { id: "science", label: "Science", icon: "🔬" },
  { id: "writing", label: "Writing & Communication", icon: "✍️" },
  { id: "arts", label: "Arts & Design", icon: "🎨" },
];

interface Cohort {
  id: string;
  degree_name: string;
}

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isStudyingDegree, setIsStudyingDegree] = useState<boolean | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Check if already completed onboarding
      const { data: onboarding } = await supabase
        .from("user_onboarding")
        .select("onboarding_completed")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (onboarding?.onboarding_completed) {
        navigate("/dashboard");
      }
    };

    const fetchCohorts = async () => {
      const { data } = await supabase
        .from("cohorts")
        .select("*")
        .order("degree_name");
      if (data) setCohorts(data);
    };

    checkAuth();
    fetchCohorts();
  }, [navigate]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Insert onboarding data
      const { error: onboardingError } = await supabase
        .from("user_onboarding")
        .insert({
          user_id: userId,
          motivation,
          is_studying_degree: isStudyingDegree || false,
          cohort_id: selectedCohort,
          onboarding_completed: true,
        });

      if (onboardingError) throw onboardingError;

      // Insert subject interests
      if (selectedInterests.length > 0) {
        const interestsToInsert = selectedInterests.map((interest) => ({
          user_id: userId,
          interest_category: interest,
        }));

        const { error: interestsError } = await supabase
          .from("user_subject_interests")
          .insert(interestsToInsert);

        if (interestsError) throw interestsError;
      }

      toast({
        title: "Welcome to Loop! 🎉",
        description: "Your learning journey begins now.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return motivation !== null;
      case 2:
        return selectedInterests.length > 0;
      case 3:
        return isStudyingDegree !== null && (isStudyingDegree ? selectedCohort !== null : true);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl p-8 bg-card/50 backdrop-blur border-2">
        <div className="flex flex-col items-center mb-8">
          <Flame className="w-10 h-10 text-accent mb-3" />
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            Welcome to Loop
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Let's personalize your experience
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                s === step
                  ? "bg-primary w-8"
                  : s < step
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Motivation */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Why are you on Loop?
              </h2>
              <p className="text-muted-foreground text-sm">
                Help us understand your learning goals
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {MOTIVATIONS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMotivation(m.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    motivation === m.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                >
                  <span className="text-2xl mb-2 block">{m.icon}</span>
                  <span className="font-medium text-sm">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                What subjects interest you?
              </h2>
              <p className="text-muted-foreground text-sm">
                Select all that apply
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3",
                    selectedInterests.includes(interest.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                >
                  <span className="text-xl">{interest.icon}</span>
                  <span className="font-medium text-sm flex-1">{interest.label}</span>
                  {selectedInterests.includes(interest.id) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Degree */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Are you studying a degree?
              </h2>
              <p className="text-muted-foreground text-sm">
                Join a cohort to compete with classmates
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setIsStudyingDegree(true);
                }}
                className={cn(
                  "px-8 py-4 rounded-xl border-2 transition-all duration-200 font-medium",
                  isStudyingDegree === true
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                Yes 🎓
              </button>
              <button
                onClick={() => {
                  setIsStudyingDegree(false);
                  setSelectedCohort(null);
                }}
                className={cn(
                  "px-8 py-4 rounded-xl border-2 transition-all duration-200 font-medium",
                  isStudyingDegree === false
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                No
              </button>
            </div>

            {isStudyingDegree && (
              <div className="space-y-3 mt-4">
                <p className="text-sm font-medium text-center text-foreground">
                  Select your degree:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
                  {cohorts.map((cohort) => (
                    <button
                      key={cohort.id}
                      onClick={() => setSelectedCohort(cohort.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium",
                        selectedCohort === cohort.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card"
                      )}
                    >
                      {cohort.degree_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button
              variant="gradient"
              onClick={nextStep}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={handleComplete}
              disabled={!canProceed() || loading}
              className="gap-2"
            >
              {loading ? "Saving..." : "Get Started"}
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;