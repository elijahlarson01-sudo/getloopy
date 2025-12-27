import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  question_count: number;
  subject_id: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "fill_in_blank";
  correct_answer: string;
  options?: string[];
  explanation: string;
  order_index: number;
}

const Lesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
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
      fetchModule();
      fetchQuestions();
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

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("module_id", lessonId)
      .order("order_index");

    if (error) {
      console.error("Error fetching questions:", error);
      return;
    }

    const typedQuestions: Question[] = (data || []).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type as "multiple_choice" | "fill_in_blank",
      correct_answer: q.correct_answer,
      options: q.options ? (q.options as string[]) : undefined,
      explanation: q.explanation || "",
      order_index: q.order_index,
    }));

    setQuestions(typedQuestions);
  };

  const handleSubmitAnswer = async () => {
    if (!userId || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    const answer =
      currentQuestion.question_type === "multiple_choice"
        ? selectedOption
        : userAnswer.trim();

    if (!answer) {
      toast({
        title: "Please provide an answer",
        variant: "destructive",
      });
      return;
    }

    const correct =
      answer.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }

    // Save attempt
    await supabase.from("user_question_attempts").insert({
      user_id: userId,
      question_id: currentQuestion.id,
      is_correct: correct,
      user_answer: answer,
    });
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setUserAnswer("");
      setSelectedOption(null);
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      // Complete the module
      if (userId && module) {
        const accuracy = Math.round((correctCount / questions.length) * 100);
        
        if (accuracy >= 80) {
          // Points earned = accuracy percentage (90% = 90 points, 100% = 100 points)
          const pointsEarned = accuracy;

          // Fetch current user progress
          const { data: currentProgress } = await supabase
            .from("user_progress")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          // Get start of current week (Monday)
          const getWeekStart = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
            d.setDate(diff);
            return d.toISOString().split('T')[0];
          };
          
          const currentWeekStart = getWeekStart(today);
          
          let newStreak = 1;
          let totalPoints = 0;
          let weeklyPoints = 0;

          if (currentProgress) {
            totalPoints = currentProgress.mastery_points || 0;
            weeklyPoints = currentProgress.weekly_mastery_points || 0;
            
            // Check if we need to reset weekly points (new week started)
            const lastResetDate = currentProgress.weekly_points_reset_date;
            if (lastResetDate) {
              const lastResetWeekStart = getWeekStart(new Date(lastResetDate));
              if (lastResetWeekStart !== currentWeekStart) {
                // New week, reset weekly points
                weeklyPoints = 0;
              }
            }
            
            // Handle streak logic
            const lastPracticeDate = currentProgress.last_practice_date;
            if (lastPracticeDate) {
              const lastDate = new Date(lastPracticeDate);
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              const lastDateStr = lastDate.toISOString().split('T')[0];
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              
              if (lastDateStr === todayStr) {
                // Already practiced today, keep same streak
                newStreak = currentProgress.current_streak;
              } else if (lastDateStr === yesterdayStr) {
                // Practiced yesterday, increment streak
                newStreak = currentProgress.current_streak + 1;
              } else {
                // Streak broken, start fresh
                newStreak = 1;
              }
            }
          }

          // Update user progress with new points and streak
          if (currentProgress) {
            // Update existing record
            await supabase
              .from("user_progress")
              .update({
                mastery_points: totalPoints + pointsEarned,
                weekly_mastery_points: weeklyPoints + pointsEarned,
                weekly_points_reset_date: currentWeekStart,
                current_streak: newStreak,
                last_practice_date: todayStr,
              })
              .eq("user_id", userId);
          } else {
            // Insert new record
            await supabase.from("user_progress").insert({
              user_id: userId,
              mastery_points: pointsEarned,
              weekly_mastery_points: pointsEarned,
              weekly_points_reset_date: currentWeekStart,
              current_streak: newStreak,
              last_practice_date: todayStr,
            });
          }

          // Update module progress
          await supabase.from("user_module_progress").upsert({
            user_id: userId,
            module_id: module.id,
            is_completed: true,
            accuracy_percentage: accuracy,
            completed_at: new Date().toISOString(),
          });

          toast({
            title: "Module Complete! 🎉",
            description: `You scored ${accuracy}% and earned ${pointsEarned} mastery points!`,
          });

          navigate(`/subject/${module.subject_id}`);
        } else {
          toast({
            title: "Practice More Needed",
            description: `You scored ${accuracy}%. You need 80% to complete this module. Try again!`,
            variant: "destructive",
          });

          // Reset to try again
          setCurrentQuestionIndex(0);
          setCorrectCount(0);
          setUserAnswer("");
          setSelectedOption(null);
          setShowFeedback(false);
          setIsCorrect(false);
        }
      }
    }
  };

  const handleBack = () => {
    if (module) {
      navigate(`/subject/${module.subject_id}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (!module || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Shuffle options for each question - memoized by question id and index
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion?.options) return undefined;
    return shuffleArray(currentQuestion.options);
  }, [currentQuestion?.id]);

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
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="text-sm font-semibold">
              Score: {correctCount}/{questions.length}
            </div>
          </div>
          <Progress value={progress} className="mb-4" />
          <h2 className="text-3xl font-bold mb-2">{module.title}</h2>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur border-2">
          <h3 className="text-2xl font-semibold mb-6">
            {currentQuestion.question_text}
          </h3>

          {currentQuestion.question_type === "multiple_choice" ? (
            <div className="space-y-3">
              {shuffledOptions?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showFeedback && setSelectedOption(option)}
                  disabled={showFeedback}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedOption === option
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  } ${showFeedback ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer..."
              disabled={showFeedback}
              className="text-lg p-6"
              onKeyPress={(e) => {
                if (e.key === "Enter" && !showFeedback) {
                  handleSubmitAnswer();
                }
              }}
            />
          )}

          {showFeedback && (
            <div
              className={`mt-6 p-4 rounded-lg border-2 ${
                isCorrect
                  ? "border-green-500 bg-green-500/10"
                  : "border-red-500 bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {isCorrect ? "Correct!" : "Incorrect"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentQuestion.explanation}
              </p>
              {!isCorrect && (
                <p className="text-sm mt-2">
                  <strong>Correct answer:</strong> {currentQuestion.correct_answer}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {!showFeedback ? (
              <Button onClick={handleSubmitAnswer} size="lg">
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext} size="lg">
                {currentQuestionIndex < questions.length - 1
                  ? "Next Question"
                  : "Complete Module"}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Lesson;
