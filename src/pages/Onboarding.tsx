import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Flame, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MOTIVATIONS = [{
  id: "quick-learning",
  label: "Quick Learning",
  icon: "⚡"
}, {
  id: "degree-support",
  label: "Degree Support",
  icon: "🎓"
}, {
  id: "career-advancement",
  label: "Career Advancement",
  icon: "📈"
}, {
  id: "personal-interest",
  label: "Personal Interest",
  icon: "💡"
}];

interface University {
  id: string;
  name: string;
}

interface Cohort {
  id: string;
  degree_name: string;
  university_id: string | null;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
}

const Onboarding = () => {
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";
  const editStep = searchParams.get("step");
  const [step, setStep] = useState(1);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isStudyingDegree, setIsStudyingDegree] = useState<boolean | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cohortSubjects, setCohortSubjects] = useState<Subject[]>([]);
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

      if (isEditMode) {
        const { data: onboarding } = await supabase
          .from("user_onboarding")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (onboarding) {
          setMotivation(onboarding.motivation);
          setIsStudyingDegree(onboarding.is_studying_degree || false);
          setSelectedCohort(onboarding.cohort_id);
          if (onboarding.cohort_id) {
            const { data: cohortData } = await supabase
              .from("cohorts")
              .select("university_id")
              .eq("id", onboarding.cohort_id)
              .maybeSingle();
            if (cohortData?.university_id) {
              setSelectedUniversity(cohortData.university_id);
            }
          }
          if (editStep === "subjects") {
            setStep(onboarding.is_studying_degree ? 5 : 3);
          }
        }
        const { data: interests } = await supabase
          .from("user_subject_interests")
          .select("interest_category")
          .eq("user_id", session.user.id);
        if (interests) {
          setSelectedInterests(interests.map(i => i.interest_category));
        }
      } else {
        const { data: onboarding } = await supabase
          .from("user_onboarding")
          .select("onboarding_completed")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (onboarding?.onboarding_completed) {
          navigate("/dashboard");
        }
      }
    };

    const fetchUniversities = async () => {
      const { data } = await supabase.from("universities").select("*").order("name");
      if (data) setUniversities(data);
    };

    const fetchSubjects = async () => {
      const { data } = await supabase.from("subjects").select("id, name, icon").order("name");
      if (data) setSubjects(data);
    };

    checkAuth();
    fetchUniversities();
    fetchSubjects();
  }, [navigate, isEditMode]);

  useEffect(() => {
    const fetchCohorts = async () => {
      if (!selectedUniversity) {
        setCohorts([]);
        return;
      }
      const { data } = await supabase
        .from("cohorts")
        .select("*")
        .eq("university_id", selectedUniversity)
        .order("degree_name");
      if (data) setCohorts(data);
    };
    fetchCohorts();
  }, [selectedUniversity]);

  useEffect(() => {
    const fetchCohortSubjects = async () => {
      if (!selectedCohort) {
        setCohortSubjects([]);
        return;
      }
      const { data: cohortSubjectLinks } = await supabase
        .from("cohort_subjects")
        .select("subject_id")
        .eq("cohort_id", selectedCohort);
      
      if (cohortSubjectLinks && cohortSubjectLinks.length > 0) {
        const subjectIds = cohortSubjectLinks.map(cs => cs.subject_id);
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("id, name, icon")
          .in("id", subjectIds)
          .order("name");
        if (subjectsData) setCohortSubjects(subjectsData);
      } else {
        setCohortSubjects([]);
      }
    };
    fetchCohortSubjects();
  }, [selectedCohort]);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleComplete = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (isEditMode) {
        const { error: onboardingError } = await supabase
          .from("user_onboarding")
          .update({
            motivation,
            is_studying_degree: isStudyingDegree || false,
            cohort_id: selectedCohort
          })
          .eq("user_id", userId);
        if (onboardingError) throw onboardingError;

        await supabase.from("user_subject_interests").delete().eq("user_id", userId);
        if (selectedInterests.length > 0) {
          const interestsToInsert = selectedInterests.map(interest => ({
            user_id: userId,
            interest_category: interest
          }));
          const { error: interestsError } = await supabase
            .from("user_subject_interests")
            .insert(interestsToInsert);
          if (interestsError) throw interestsError;
        }
        toast({
          title: "Preferences Updated",
          description: "Your learning preferences have been saved."
        });
      } else {
        const { error: onboardingError } = await supabase
          .from("user_onboarding")
          .upsert({
            user_id: userId,
            motivation,
            is_studying_degree: isStudyingDegree || false,
            cohort_id: selectedCohort,
            onboarding_completed: true
          }, { onConflict: 'user_id' });
        if (onboardingError) throw onboardingError;

        if (selectedInterests.length > 0) {
          const interestsToInsert = selectedInterests.map(interest => ({
            user_id: userId,
            interest_category: interest
          }));
          const { error: interestsError } = await supabase
            .from("user_subject_interests")
            .insert(interestsToInsert);
          if (interestsError) throw interestsError;
        }
        toast({
          title: "Welcome to Loop!",
          description: "Your learning journey begins now."
        });
      }
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalSteps = () => {
    if (isStudyingDegree === null) return 5;
    return isStudyingDegree ? 5 : 3;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return motivation !== null;
      case 2:
        return isStudyingDegree !== null;
      case 3:
        return isStudyingDegree ? selectedUniversity !== null : selectedInterests.length > 0;
      case 4:
        return selectedCohort !== null;
      case 5:
        return selectedInterests.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (step < getTotalSteps()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const isLastStep = isStudyingDegree ? step === 5 : step === 3;
  const generalSubjects = subjects.filter(s => !cohortSubjects.some(cs => cs.id === s.id));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative">
      {/* Subtle dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-40" />

      <div className="w-full max-w-2xl doodle-box p-8 relative z-10">
        {isEditMode && (
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => navigate("/dashboard")}>
            <X className="w-4 h-4" />
          </Button>
        )}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 border-2 border-foreground rounded-xl flex items-center justify-center mb-3">
            <Flame className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="font-display text-2xl text-foreground">
            {isEditMode ? "Edit Preferences" : "Welcome to Loop"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Let's personalize your experience
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map(s => (
            <div key={s} className={cn("h-2 rounded-full transition-all duration-300 border border-foreground", s === step ? "bg-foreground w-8" : s < step ? "bg-foreground w-3" : "bg-background w-3")} />
          ))}
        </div>

        {/* Step 1: Motivation */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-xl text-foreground mb-2">Why are you on Loop?</h2>
              <p className="text-muted-foreground text-sm">Help us understand your learning goals</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOTIVATIONS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMotivation(m.id)}
                  className={cn("sketch-card p-4 transition-all duration-200 text-left hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", motivation === m.id ? "bg-foreground text-background" : "")}
                >
                  <span className="text-2xl mb-2 block">{m.icon}</span>
                  <span className="font-medium text-sm">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Student Status */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-xl text-foreground mb-2">Are you a current student?</h2>
              <p className="text-muted-foreground text-sm">Join a cohort to compete with classmates</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsStudyingDegree(true)}
                className={cn("sketch-card px-8 py-4 transition-all duration-200 font-medium hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", isStudyingDegree === true ? "bg-foreground text-background" : "")}
              >
                Yes 🎓
              </button>
              <button
                onClick={() => {
                  setIsStudyingDegree(false);
                  setSelectedUniversity(null);
                  setSelectedCohort(null);
                }}
                className={cn("sketch-card px-8 py-4 transition-all duration-200 font-medium hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", isStudyingDegree === false ? "bg-foreground text-background" : "")}
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Step 3: University Selection (students) OR Subjects (non-students) */}
        {step === 3 && isStudyingDegree && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-xl text-foreground mb-2">Select your university</h2>
              <p className="text-muted-foreground text-sm">Find your school to join your cohort</p>
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
              {universities.map(uni => (
                <button
                  key={uni.id}
                  onClick={() => {
                    setSelectedUniversity(uni.id);
                    setSelectedCohort(null);
                    setSelectedInterests([]);
                  }}
                  className={cn("sketch-card p-4 transition-all duration-200 font-medium text-left hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", selectedUniversity === uni.id ? "bg-foreground text-background" : "")}
                >
                  {uni.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && isStudyingDegree === false && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-xl text-foreground mb-2">What subjects interest you?</h2>
              <p className="text-muted-foreground text-sm">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => toggleInterest(subject.id)}
                  className={cn("sketch-card p-3 transition-all duration-200 text-left flex items-center gap-3 hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", selectedInterests.includes(subject.id) ? "bg-foreground text-background" : "")}
                >
                  <span className="font-medium text-sm flex-1">{subject.name}</span>
                  {selectedInterests.includes(subject.id) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Degree Selection (students only) */}
        {step === 4 && isStudyingDegree && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-xl text-foreground mb-2">Select your degree</h2>
              <p className="text-muted-foreground text-sm">Choose your program to see relevant content</p>
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
              {cohorts.map(cohort => (
                <button
                  key={cohort.id}
                  onClick={() => {
                    setSelectedCohort(cohort.id);
                    setSelectedInterests([]);
                  }}
                  className={cn("sketch-card p-4 transition-all duration-200 font-medium text-left hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", selectedCohort === cohort.id ? "bg-foreground text-background" : "")}
                >
                  {cohort.degree_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Subject Selection (students only, cohort-specific AND general) */}
        {step === 5 && isStudyingDegree && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-display text-xl text-foreground mb-2">Select your subjects</h2>
              <p className="text-muted-foreground text-sm">Choose from your degree subjects and general topics</p>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-6">
              {cohortSubjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Degree Subjects</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {cohortSubjects.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => toggleInterest(subject.id)}
                        className={cn("sketch-card p-3 transition-all duration-200 text-left flex items-center gap-3 hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", selectedInterests.includes(subject.id) ? "bg-foreground text-background" : "")}
                      >
                        <span className="font-medium text-sm flex-1">{subject.name}</span>
                        {selectedInterests.includes(subject.id) && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">General Subjects</h3>
                <div className="grid grid-cols-2 gap-3">
                  {generalSubjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => toggleInterest(subject.id)}
                      className={cn("sketch-card p-3 transition-all duration-200 text-left flex items-center gap-3 hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5", selectedInterests.includes(subject.id) ? "bg-foreground text-background" : "")}
                    >
                      <span className="font-medium text-sm flex-1">{subject.name}</span>
                      {selectedInterests.includes(subject.id) && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t-2 border-foreground">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || loading}
            >
              {loading ? "Saving..." : isEditMode ? "Save Changes" : "Get Started"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;