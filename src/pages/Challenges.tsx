import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Swords, Trophy, Clock, RotateCcw, Minus, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LightningRound from "@/components/LightningRound";
import ChallengeResultModal from "@/components/ChallengeResultModal";

interface Challenge {
  id: string;
  challenger_user_id: string;
  opponent_user_id: string;
  subject_id: string;
  stake_points: number;
  status: string;
  winner_user_id: string | null;
  is_draw: boolean;
  created_at: string;
  completed_at: string | null;
  challenger_name?: string;
  opponent_name?: string;
  subject_name?: string;
  my_score?: number;
  opponent_score?: number;
  my_attempt?: ChallengeAttempt | null;
  opponent_attempt?: ChallengeAttempt | null;
}

interface ChallengeAttempt {
  score: number;
  questions_answered: number;
  seconds_used: number;
}

const Challenges = () => {
  const [user, setUser] = useState<any>(null);
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [playingRound, setPlayingRound] = useState(false);
  const [resultChallenge, setResultChallenge] = useState<Challenge | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchChallenges(session.user.id);

      // Check if we need to start a challenge immediately
      const startChallengeId = searchParams.get("start");
      if (startChallengeId) {
        const { data: challenge } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", startChallengeId)
          .single();
        
        if (challenge && challenge.challenger_user_id === session.user.id) {
          // Check if user already played
          const { data: attempt } = await supabase
            .from("challenge_attempts")
            .select("*")
            .eq("challenge_id", startChallengeId)
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!attempt) {
            setActiveChallenge(challenge as any);
            setPlayingRound(true);
          }
        }
      }
    };

    checkAuth();
  }, [navigate, searchParams]);

  const fetchChallenges = async (userId: string) => {
    setLoading(true);

    // Get all challenges for this user
    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("*")
      .or(`challenger_user_id.eq.${userId},opponent_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching challenges:", error);
      setLoading(false);
      return;
    }

    if (!challenges || challenges.length === 0) {
      setLoading(false);
      return;
    }

    // Get all user IDs and subject IDs
    const userIds = new Set<string>();
    const subjectIds = new Set<string>();
    challenges.forEach(c => {
      userIds.add(c.challenger_user_id);
      userIds.add(c.opponent_user_id);
      subjectIds.add(c.subject_id);
    });

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(userIds));

    // Fetch subjects
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name")
      .in("id", Array.from(subjectIds));

    // Fetch all attempts
    const { data: attempts } = await supabase
      .from("challenge_attempts")
      .select("*")
      .in("challenge_id", challenges.map(c => c.id));

    // Map challenges with names
    const enrichedChallenges: Challenge[] = challenges.map(c => {
      const challenger = profiles?.find(p => p.id === c.challenger_user_id);
      const opponent = profiles?.find(p => p.id === c.opponent_user_id);
      const subject = subjects?.find(s => s.id === c.subject_id);
      const myAttempt = attempts?.find(a => a.challenge_id === c.id && a.user_id === userId);
      const opponentAttempt = attempts?.find(a => a.challenge_id === c.id && a.user_id !== userId);

      return {
        ...c,
        challenger_name: challenger?.full_name || challenger?.email?.split("@")[0] || "Unknown",
        opponent_name: opponent?.full_name || opponent?.email?.split("@")[0] || "Unknown",
        subject_name: subject?.name || "Unknown",
        my_score: myAttempt?.score,
        opponent_score: opponentAttempt?.score,
        my_attempt: myAttempt ? {
          score: myAttempt.score,
          questions_answered: myAttempt.questions_answered,
          seconds_used: Number(myAttempt.seconds_used),
        } : null,
        opponent_attempt: opponentAttempt ? {
          score: opponentAttempt.score,
          questions_answered: opponentAttempt.questions_answered,
          seconds_used: Number(opponentAttempt.seconds_used),
        } : null,
      };
    });

    // Split into pending and completed
    const pending = enrichedChallenges.filter(c => c.status === "pending");
    const completed = enrichedChallenges.filter(c => c.status === "completed");

    setPendingChallenges(pending);
    setCompletedChallenges(completed);
    setLoading(false);
  };

  const handlePlayChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    setPlayingRound(true);
  };

  const handleRoundComplete = async (score: number, questionsAnswered: number, secondsUsed: number) => {
    if (!activeChallenge || !user) return;

    // Save the attempt
    const { error: attemptError } = await supabase
      .from("challenge_attempts")
      .insert({
        challenge_id: activeChallenge.id,
        user_id: user.id,
        score,
        questions_answered: questionsAnswered,
        seconds_used: secondsUsed,
      });

    if (attemptError) {
      console.error("Error saving attempt:", attemptError);
      toast({
        title: "Error",
        description: "Failed to save your attempt.",
        variant: "destructive",
      });
      setPlayingRound(false);
      setActiveChallenge(null);
      return;
    }

    // Check if both players have played
    const { data: attempts } = await supabase
      .from("challenge_attempts")
      .select("*")
      .eq("challenge_id", activeChallenge.id);

    if (attempts && attempts.length === 2) {
      // Both have played - determine winner
      await determineWinner(activeChallenge, attempts);
    } else {
      toast({
        title: "Round complete!",
        description: `You scored ${score} points. Waiting for your opponent to play.`,
      });
    }

    setPlayingRound(false);
    setActiveChallenge(null);
    await fetchChallenges(user.id);
  };

  const determineWinner = async (challenge: Challenge, attempts: any[]) => {
    const challengerAttempt = attempts.find(a => a.user_id === challenge.challenger_user_id);
    const opponentAttempt = attempts.find(a => a.user_id === challenge.opponent_user_id);

    if (!challengerAttempt || !opponentAttempt) return;

    let winnerId: string | null = null;
    let isDraw = false;

    // Compare scores
    if (challengerAttempt.score > opponentAttempt.score) {
      winnerId = challenge.challenger_user_id;
    } else if (opponentAttempt.score > challengerAttempt.score) {
      winnerId = challenge.opponent_user_id;
    } else {
      // Tie - compare time (lower is better)
      if (challengerAttempt.seconds_used < opponentAttempt.seconds_used) {
        winnerId = challenge.challenger_user_id;
      } else if (opponentAttempt.seconds_used < challengerAttempt.seconds_used) {
        winnerId = challenge.opponent_user_id;
      } else {
        // Still tied - it's a draw
        isDraw = true;
      }
    }

    // Update challenge status
    await supabase
      .from("challenges")
      .update({
        status: "completed",
        winner_user_id: winnerId,
        is_draw: isDraw,
        completed_at: new Date().toISOString(),
      })
      .eq("id", challenge.id);

    // Transfer points if there's a winner
    if (winnerId && !isDraw) {
      const loserId = winnerId === challenge.challenger_user_id 
        ? challenge.opponent_user_id 
        : challenge.challenger_user_id;

      // Update points manually
      await updatePointsManually(winnerId, loserId, challenge.stake_points);
    }

    const myScore = user?.id === challenge.challenger_user_id 
      ? challengerAttempt.score 
      : opponentAttempt.score;
    const theirScore = user?.id === challenge.challenger_user_id 
      ? opponentAttempt.score 
      : challengerAttempt.score;

    if (isDraw) {
      toast({ title: "It's a draw!", description: `Both scored ${myScore} points.` });
    } else if (winnerId === user?.id) {
      toast({ title: "You won! 🎉", description: `+${challenge.stake_points} points` });
    } else {
      toast({ title: "You lost", description: `-${challenge.stake_points} points` });
    }
  };

  const updatePointsManually = async (winnerId: string, loserId: string, points: number) => {
    // Get current points
    const { data: winnerProgress } = await supabase
      .from("user_progress")
      .select("weekly_mastery_points, mastery_points")
      .eq("user_id", winnerId)
      .single();

    const { data: loserProgress } = await supabase
      .from("user_progress")
      .select("weekly_mastery_points, mastery_points")
      .eq("user_id", loserId)
      .single();

    if (winnerProgress) {
      await supabase
        .from("user_progress")
        .update({
          weekly_mastery_points: winnerProgress.weekly_mastery_points + points,
          mastery_points: winnerProgress.mastery_points + points,
        })
        .eq("user_id", winnerId);
    }

    if (loserProgress) {
      await supabase
        .from("user_progress")
        .update({
          weekly_mastery_points: Math.max(0, loserProgress.weekly_mastery_points - points),
          mastery_points: Math.max(0, loserProgress.mastery_points - points),
        })
        .eq("user_id", loserId);
    }
  };

  const handleRematch = async (challenge: Challenge) => {
    // Create a new challenge with same settings but swapped roles
    const { data: newChallenge, error } = await supabase
      .from("challenges")
      .insert({
        challenger_user_id: user.id,
        opponent_user_id: challenge.challenger_user_id === user.id 
          ? challenge.opponent_user_id 
          : challenge.challenger_user_id,
        cohort_id: (await supabase
          .from("user_onboarding")
          .select("cohort_id")
          .eq("user_id", user.id)
          .single()).data?.cohort_id,
        subject_id: challenge.subject_id,
        stake_points: challenge.stake_points,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create rematch.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Rematch created!",
      description: "Get ready for another round!",
    });

    navigate(`/challenges?start=${newChallenge.id}`);
  };

  const canPlay = (challenge: Challenge) => {
    // Can play if we haven't submitted an attempt yet
    return !challenge.my_attempt;
  };

  const getResultIcon = (challenge: Challenge) => {
    if (challenge.is_draw) return <Minus className="w-5 h-5 text-muted-foreground" />;
    if (challenge.winner_user_id === user?.id) return <Trophy className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  const getResultText = (challenge: Challenge) => {
    if (challenge.is_draw) return "Draw";
    if (challenge.winner_user_id === user?.id) return "Won";
    return "Lost";
  };

  const getPointsText = (challenge: Challenge) => {
    if (challenge.is_draw) return "0";
    if (challenge.winner_user_id === user?.id) return `+${challenge.stake_points}`;
    return `-${challenge.stake_points}`;
  };

  // If playing a round, show the Lightning Round
  if (playingRound && activeChallenge) {
    return (
      <LightningRound
        challengeId={activeChallenge.id}
        subjectId={activeChallenge.subject_id}
        userId={user.id}
        onComplete={handleRoundComplete}
        onCancel={() => {
          setPlayingRound(false);
          setActiveChallenge(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-accent" />
              <h1 className="text-xl font-bold">Challenges</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="incoming" className="flex-1 gap-2">
              <Clock className="w-4 h-4" />
              Incoming ({pendingChallenges.filter(c => canPlay(c)).length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 gap-2">
              <Trophy className="w-4 h-4" />
              Completed ({completedChallenges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </Card>
                ))}
              </div>
            ) : pendingChallenges.filter(c => canPlay(c)).length === 0 ? (
              <Card className="p-8 text-center">
                <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending challenges</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Challenge someone from the leaderboard!
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              </Card>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4">
                  {pendingChallenges.filter(c => canPlay(c)).map(challenge => (
                    <Card key={challenge.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Swords className="w-4 h-4 text-accent" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {challenge.challenger_user_id === user?.id 
                                ? `vs ${challenge.opponent_name}`
                                : `${challenge.challenger_name} challenged you`
                              }
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {challenge.subject_name} • {challenge.stake_points} pts
                            </p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handlePlayChallenge(challenge)} className="flex-shrink-0">
                          Play
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedChallenges.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed challenges yet</p>
              </Card>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4">
                  {completedChallenges.map(challenge => (
                    <Card 
                      key={challenge.id} 
                      className="p-4 cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => setResultChallenge(challenge)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getResultIcon(challenge)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {challenge.challenger_user_id === user?.id 
                                ? `vs ${challenge.opponent_name}`
                                : `vs ${challenge.challenger_name}`
                              }
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {challenge.subject_name} • {getResultText(challenge)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-sm ${
                            challenge.winner_user_id === user?.id 
                              ? 'text-success' 
                              : challenge.is_draw 
                              ? 'text-muted-foreground'
                              : 'text-destructive'
                          }`}>
                            {getPointsText(challenge)} pts
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {challenge.my_score} - {challenge.opponent_score}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Result Modal */}
      {resultChallenge && (
        <ChallengeResultModal
          open={!!resultChallenge}
          onOpenChange={(open) => !open && setResultChallenge(null)}
          challenge={resultChallenge}
          userId={user?.id}
          onRematch={() => handleRematch(resultChallenge)}
        />
      )}
    </div>
  );
};

export default Challenges;
