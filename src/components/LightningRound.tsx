import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_text: string;
  options: unknown;
  correct_answer: string;
}

interface LightningRoundProps {
  challengeId: string;
  subjectId: string;
  userId: string;
  onComplete: (score: number, questionsAnswered: number, secondsUsed: number) => void;
  onCancel: () => void;
}

const ROUND_DURATION = 30; // seconds

const LightningRound = ({
  challengeId,
  subjectId,
  userId,
  onComplete,
  onCancel,
}: LightningRoundProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const { toast } = useToast();

  // Fetch questions for the subject
  useEffect(() => {
    const fetchQuestions = async () => {
      // Get modules for this subject
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("subject_id", subjectId);

      if (!modules || modules.length === 0) {
        toast({
          title: "No questions available",
          description: "This subject doesn't have any questions yet.",
          variant: "destructive",
        });
        onCancel();
        return;
      }

      const moduleIds = modules.map(m => m.id);

      // Get random multiple choice questions
      const { data: questionsData, error } = await supabase
        .from("questions")
        .select("id, question_text, options, correct_answer")
        .in("module_id", moduleIds)
        .eq("question_type", "multiple_choice")
        .limit(20);

      if (error || !questionsData || questionsData.length === 0) {
        toast({
          title: "No questions available",
          description: "Couldn't load questions for this challenge.",
          variant: "destructive",
        });
        onCancel();
        return;
      }

      // Shuffle questions
      const shuffled = questionsData.sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setLoading(false);
    };

    fetchQuestions();
  }, [subjectId, onCancel, toast]);

  // Timer countdown
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

  // Handle time up
  useEffect(() => {
    if (timeLeft === 0 && !loading) {
      const secondsUsed = (Date.now() - startTime) / 1000;
      onComplete(score, currentIndex, Math.min(secondsUsed, ROUND_DURATION));
    }
  }, [timeLeft, loading, score, currentIndex, startTime, onComplete]);

  const handleAnswer = useCallback((answer: string) => {
    if (showFeedback || timeLeft <= 0) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correct_answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Brief feedback then move to next
    setTimeout(() => {
      if (currentIndex < questions.length - 1 && timeLeft > 0) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // End of questions or time
        const secondsUsed = (Date.now() - startTime) / 1000;
        onComplete(
          isCorrect ? score + 1 : score,
          currentIndex + 1,
          Math.min(secondsUsed, ROUND_DURATION)
        );
      }
    }, 500);
  }, [showFeedback, timeLeft, questions, currentIndex, score, startTime, onComplete]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading Lightning Round...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = (timeLeft / ROUND_DURATION) * 100;
  const options = Array.isArray(currentQuestion?.options) ? currentQuestion.options as string[] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <span className="font-bold">Lightning Round</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="font-bold">{score}</span>
              </div>
              <div className={`flex items-center gap-1 text-sm ${timeLeft <= 10 ? 'text-destructive animate-pulse' : ''}`}>
                <Clock className="w-4 h-4" />
                <span className="font-bold">{timeLeft}s</span>
              </div>
            </div>
          </div>
          <Progress 
            value={progress} 
            className={`h-2 ${timeLeft <= 10 ? '[&>div]:bg-destructive' : ''}`}
          />
        </div>

        {/* Question Card */}
        <Card className="p-4 sm:p-6 mb-6">
          <p className="text-xs text-muted-foreground mb-2">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <h3 className="text-base sm:text-lg font-bold mb-4 leading-tight line-clamp-3">
            {currentQuestion?.question_text}
          </h3>

          {/* Options */}
          <div className="space-y-2">
            {options?.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion?.correct_answer;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <Button
                  key={idx}
                  variant="outline"
                  className={`w-full justify-start text-left h-auto py-3 px-3 text-sm leading-snug whitespace-normal ${
                    showCorrect
                      ? "border-success bg-success/10 text-success"
                      : showWrong
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : isSelected
                      ? "border-primary bg-primary/10"
                      : ""
                  }`}
                  onClick={() => handleAnswer(option)}
                  disabled={showFeedback}
                >
                  <span className="flex items-center gap-2 w-full">
                    <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 break-words">{option}</span>
                    {showCorrect && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                    {showWrong && <XCircle className="w-4 h-4 flex-shrink-0" />}
                  </span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Cancel button */}
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel Challenge
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LightningRound;
