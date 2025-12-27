import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Flame, ChevronRight, ChevronLeft, Check, Sparkles, X } from "lucide-react";
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [suggestedUniversity, setSuggestedUniversity] = useState<string | null>(null);
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
      setUserEmail(session.user.email || null);

      // Auto-detect university from email domain
      if (session.user.email && !isEditMode) {
        const emailDomain = session.user.email.split("@")[1];
        if (emailDomain) {
          const { data: domainMatch } = await supabase
            .from("university_domains")
            .select("university_id")
            .eq("domain", emailDomain)
            .maybeSingle();
          
          if (domainMatch) {
            setSuggestedUniversity(domainMatch.university_id);
            setSelectedUniversity(domainMatch.university_id);
          }
        }
      }

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
          // Jump to subjects step if requested
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

  // Fetch cohorts when university changes
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

  // Fetch cohort-specific subjects when cohort changes
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
          title: "Welcome to Loop! 🎉",
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

  // Flow: Motivation → Student? → University (if yes) → Degree (if yes) → Subjects
  const getTotalSteps = () => {
    if (isStudyingDegree === null) return 5; // max possible
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
  // General subjects are all subjects not in cohort-specific list
  const generalSubjects = subjects.filter(s => !cohortSubjects.some(cs => cs.id === s.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl p-8 bg-card/50 backdrop-blur border-2 relative">
        {isEditMode && (
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => navigate("/dashboard")}>
            <X className="w-4 h-4" />
          </Button>
        )}
        <div className="flex flex-col items-center mb-8">
          <Flame className="w-10 h-10 text-accent mb-3" />
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
            {isEditMode ? "Edit Preferences" : "Welcome to Loop"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Let's personalize your experience
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map(s => (
            <div key={s} className={cn("w-3 h-3 rounded-full transition-all duration-300", s === step ? "bg-primary w-8" : s < step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        {/* Step 1: Motivation */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">Why are you on Loop?</h2>
              <p className="text-muted-foreground text-sm">Help us understand your learning goals</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOTIVATIONS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMotivation(m.id)}
                  className={cn("p-4 rounded-xl border-2 transition-all duration-200 text-left", motivation === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
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
              <h2 className="text-xl font-bold text-foreground mb-2">Are you a current student?</h2>
              <p className="text-muted-foreground text-sm">Join a cohort to compete with classmates</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsStudyingDegree(true)}
                className={cn("px-8 py-4 rounded-xl border-2 transition-all duration-200 font-medium", isStudyingDegree === true ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
              >
                Yes 🎓
              </button>
              <button
                onClick={() => {
                  setIsStudyingDegree(false);
                  setSelectedUniversity(null);
                  setSelectedCohort(null);
                }}
                className={cn("px-8 py-4 rounded-xl border-2 transition-all duration-200 font-medium", isStudyingDegree === false ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
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
              <h2 className="text-xl font-bold text-foreground mb-2">Select your university</h2>
              <p className="text-muted-foreground text-sm">
                {suggestedUniversity ? "We detected your university from your email!" : "Find your school to join your cohort"}
              </p>
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
                  className={cn("p-4 rounded-xl border-2 transition-all duration-200 font-medium text-left", selectedUniversity === uni.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
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
              <h2 className="text-xl font-bold text-foreground mb-2">What subjects interest you?</h2>
              <p className="text-muted-foreground text-sm">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => toggleInterest(subject.id)}
                  className={cn("p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3", selectedInterests.includes(subject.id) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
                >
                  <span className="font-medium text-sm flex-1">{subject.name}</span>
                  {selectedInterests.includes(subject.id) && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Degree Selection (students only) */}
        {step === 4 && isStudyingDegree && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">Select your degree</h2>
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
                  className={cn("p-4 rounded-xl border-2 transition-all duration-200 font-medium text-left", selectedCohort === cohort.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
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
              <h2 className="text-xl font-bold text-foreground mb-2">Select your subjects</h2>
              <p className="text-muted-foreground text-sm">Choose from your degree subjects and general topics</p>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-6">
              {/* Cohort-specific subjects */}
              {cohortSubjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Your Degree Subjects</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {cohortSubjects.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => toggleInterest(subject.id)}
                        className={cn("p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3", selectedInterests.includes(subject.id) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
                      >
                        <span className="font-medium text-sm flex-1">{subject.name}</span>
                        {selectedInterests.includes(subject.id) && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* General subjects */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">General Topics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {generalSubjects.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => toggleInterest(subject.id)}
                      className={cn("p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3", selectedInterests.includes(subject.id) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card")}
                    >
                      <span className="font-medium text-sm flex-1">{subject.name}</span>
                      {selectedInterests.includes(subject.id) && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={prevStep} disabled={step === 1} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {!isLastStep ? (
            <Button variant="gradient" onClick={nextStep} disabled={!canProceed()} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={handleComplete} disabled={!canProceed() || loading} className="gap-2">
              {loading ? "Saving..." : isEditMode ? "Save Changes" : "Get Started"}
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
