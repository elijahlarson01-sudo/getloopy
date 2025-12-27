import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Minus, RotateCcw, Clock, Sparkles, BookOpen, Flame, ChevronUp, ChevronDown } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useEffect, useState } from "react";

interface ChallengeAttempt {
  score: number;
  questions_answered: number;
  seconds_used: number;
}

interface Challenge {
  id: string;
  challenger_user_id: string;
  opponent_user_id: string;
  stake_points: number;
  winner_user_id: string | null;
  is_draw: boolean;
  challenger_name?: string;
  opponent_name?: string;
  subject_name?: string;
  subject_id?: string;
  my_attempt?: ChallengeAttempt | null;
  opponent_attempt?: ChallengeAttempt | null;
}

interface ChallengeResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: Challenge;
  userId: string;
  weeklyPoints?: number;
  onRematch: () => void;
  onRevenge?: (stakePoints: number) => void;
}

const winMessages = [
  "Absolutely crushed it! 🔥",
  "Victory is yours!",
  "Brilliant performance!",
  "You're on fire!",
  "Champion material!",
];

const loseMessages = [
  "They got lucky.",
  "Run it back.",
  "Redemption arc loading…",
  "Time to settle the score.",
  "Not over yet.",
];

const drawMessages = [
  "Evenly matched!",
  "A battle of equals",
  "Too close to call!",
];

const revengeTaglines = [
  "Same opponent. Same subject. Settle it.",
  "Show them what you're really made of.",
  "This time, it's personal.",
];

const ChallengeResultModal = ({
  open,
  onOpenChange,
  challenge,
  userId,
  weeklyPoints = 100,
  onRematch,
  onRevenge,
}: ChallengeResultModalProps) => {
  const isWinner = challenge.winner_user_id === userId;
  const isDraw = challenge.is_draw;
  const isChallenger = challenge.challenger_user_id === userId;
  const { playCorrect, playIncorrect } = useSoundEffects();

  const myName = isChallenger ? challenge.challenger_name : challenge.opponent_name;
  const opponentName = isChallenger ? challenge.opponent_name : challenge.challenger_name;

  const myAttempt = challenge.my_attempt;
  const opponentAttempt = challenge.opponent_attempt;

  // Revenge stake - default to original + 10, capped at 30% of weekly points
  const maxRevengStake = Math.max(challenge.stake_points, Math.floor(weeklyPoints * 0.3));
  const defaultRevengeStake = Math.min(challenge.stake_points + 10, maxRevengStake);
  const [revengeStake, setRevengeStake] = useState(defaultRevengeStake);

  // Reset stake when modal opens
  useEffect(() => {
    if (open) {
      setRevengeStake(Math.min(challenge.stake_points + 10, maxRevengStake));
    }
  }, [open, challenge.stake_points, maxRevengStake]);

  // Play sound effect when modal opens
  useEffect(() => {
    if (open) {
      if (isWinner) {
        playCorrect();
      } else if (!isDraw) {
        playIncorrect();
      }
    }
  }, [open, isWinner, isDraw]);

  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getResultColor = () => {
    if (isDraw) return "text-muted-foreground";
    if (isWinner) return "text-success";
    return "text-destructive";
  };

  const getResultBgGradient = () => {
    if (isDraw) return "from-muted/20 to-muted/10";
    if (isWinner) return "from-success/20 to-success/5";
    return "from-destructive/20 to-destructive/5";
  };

  const getResultIcon = () => {
    if (isDraw) return <Minus className="w-20 h-20 text-muted-foreground" />;
    if (isWinner) return <Trophy className="w-20 h-20 text-yellow-500 drop-shadow-lg" />;
    return <BookOpen className="w-20 h-20 text-destructive" />;
  };

  const getResultText = () => {
    if (isDraw) return "It's a Draw!";
    if (isWinner) return "You Won!";
    return "You Lost";
  };

  const getEncouragingMessage = () => {
    if (isDraw) return getRandomMessage(drawMessages);
    if (isWinner) return getRandomMessage(winMessages);
    return getRandomMessage(loseMessages);
  };

  const getPointsText = () => {
    if (isDraw) return "No points exchanged";
    if (isWinner) return `+${challenge.stake_points} points`;
    return `-${challenge.stake_points} points`;
  };

  const adjustStake = (delta: number) => {
    const newStake = Math.max(5, Math.min(maxRevengStake, revengeStake + delta));
    setRevengeStake(newStake);
  };

  const handleRevenge = () => {
    onOpenChange(false);
    if (onRevenge) {
      onRevenge(revengeStake);
    }
  };

  const isLoser = !isWinner && !isDraw;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Challenge Result</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Result Icon with gradient background */}
          <div className={`flex flex-col items-center p-5 -mx-6 bg-gradient-to-br ${getResultBgGradient()}`}>
            <div className="relative">
              {isWinner && (
                <div className="absolute inset-0 animate-pulse">
                  <Sparkles className="w-20 h-20 text-yellow-400/50" />
                </div>
              )}
              {getResultIcon()}
            </div>
            <h2 className={`text-3xl font-black mt-3 ${getResultColor()}`}>
              {getResultText()}
            </h2>
            <p className={`text-xl font-semibold mt-1 ${getResultColor()}`}>
              {getPointsText()}
            </p>
            <p className="text-base text-muted-foreground mt-2 text-center italic">
              {getEncouragingMessage()}
            </p>
          </div>

          {/* Score Comparison */}
          <div className="grid grid-cols-3 gap-4 items-center px-2">
            {/* Your Score */}
            <div className="text-center">
              <div className={`text-4xl font-black ${isWinner ? 'text-success' : isDraw ? 'text-foreground' : 'text-muted-foreground'}`}>
                {myAttempt?.score ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate font-medium">
                {myName} (You)
              </p>
              {myAttempt && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {myAttempt.seconds_used.toFixed(1)}s
                </div>
              )}
            </div>

            {/* VS */}
            <div className="text-center">
              <span className="text-xl font-bold text-muted-foreground">vs</span>
            </div>

            {/* Opponent Score */}
            <div className="text-center">
              <div className={`text-4xl font-black ${!isWinner && !isDraw ? 'text-success' : isDraw ? 'text-foreground' : 'text-muted-foreground'}`}>
                {opponentAttempt?.score ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate font-medium">
                {opponentName}
              </p>
              {opponentAttempt && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {opponentAttempt.seconds_used.toFixed(1)}s
                </div>
              )}
            </div>
          </div>

          {/* Subject Info */}
          <p className="text-center text-sm text-muted-foreground font-medium">
            {challenge.subject_name} • {challenge.stake_points} pts wagered
          </p>

          {/* Revenge Section - Only show if user lost */}
          {isLoser && onRevenge && (
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-4 border border-accent/20">
              <div className="text-center mb-3">
                <h3 className="text-xl font-black text-accent flex items-center justify-center gap-2">
                  <Flame className="w-5 h-5" />
                  Revenge?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {getRandomMessage(revengeTaglines)}
                </p>
              </div>

              {/* Stake Selector */}
              <div className="flex items-center justify-center gap-4 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustStake(-5)}
                  disabled={revengeStake <= 5}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="text-center">
                  <span className="text-2xl font-black text-accent">{revengeStake}</span>
                  <span className="text-sm text-muted-foreground ml-1">pts</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustStake(5)}
                  disabled={revengeStake >= maxRevengStake}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleRevenge}
                className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              >
                <Flame className="w-4 h-4" />
                Get Revenge
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {!isLoser && (
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onRematch();
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Rematch
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeResultModal;
