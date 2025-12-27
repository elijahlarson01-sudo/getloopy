import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Minus, XCircle, RotateCcw, Clock, Sparkles, BookOpen } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useEffect } from "react";

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
  my_attempt?: ChallengeAttempt | null;
  opponent_attempt?: ChallengeAttempt | null;
}

interface ChallengeResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: Challenge;
  userId: string;
  onRematch: () => void;
}

const winMessages = [
  "Absolutely crushed it! 🔥",
  "Victory is yours!",
  "Brilliant performance!",
  "You're on fire!",
  "Champion material!",
];

const loseMessages = [
  "Better luck next time!",
  "Time to hit the books again 📚",
  "Every loss is a lesson learned",
  "Keep practicing, you'll get them next time!",
  "Don't give up - rematch awaits!",
];

const drawMessages = [
  "Evenly matched!",
  "A battle of equals",
  "Too close to call!",
];

const ChallengeResultModal = ({
  open,
  onOpenChange,
  challenge,
  userId,
  onRematch,
}: ChallengeResultModalProps) => {
  const isWinner = challenge.winner_user_id === userId;
  const isDraw = challenge.is_draw;
  const isChallenger = challenge.challenger_user_id === userId;
  const { playCorrect, playIncorrect } = useSoundEffects();

  const myName = isChallenger ? challenge.challenger_name : challenge.opponent_name;
  const opponentName = isChallenger ? challenge.opponent_name : challenge.challenger_name;

  const myAttempt = challenge.my_attempt;
  const opponentAttempt = challenge.opponent_attempt;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Challenge Result</DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Result Icon with gradient background */}
          <div className={`flex flex-col items-center p-6 -mx-6 bg-gradient-to-br ${getResultBgGradient()}`}>
            <div className="relative">
              {isWinner && (
                <div className="absolute inset-0 animate-pulse">
                  <Sparkles className="w-20 h-20 text-yellow-400/50" />
                </div>
              )}
              {getResultIcon()}
            </div>
            <h2 className={`text-3xl font-black mt-4 ${getResultColor()}`}>
              {getResultText()}
            </h2>
            <p className={`text-xl font-semibold mt-1 ${getResultColor()}`}>
              {getPointsText()}
            </p>
            <p className="text-base text-muted-foreground mt-3 text-center italic">
              {getEncouragingMessage()}
            </p>
          </div>

          {/* Score Comparison */}
          <div className="grid grid-cols-3 gap-4 items-center px-2">
            {/* Your Score */}
            <div className="text-center">
              <div className={`text-5xl font-black ${isWinner ? 'text-success' : isDraw ? 'text-foreground' : 'text-muted-foreground'}`}>
                {myAttempt?.score ?? "-"}
              </div>
              <p className="text-sm text-muted-foreground mt-2 truncate font-medium">
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
              <span className="text-2xl font-bold text-muted-foreground">vs</span>
            </div>

            {/* Opponent Score */}
            <div className="text-center">
              <div className={`text-5xl font-black ${!isWinner && !isDraw ? 'text-success' : isDraw ? 'text-foreground' : 'text-muted-foreground'}`}>
                {opponentAttempt?.score ?? "-"}
              </div>
              <p className="text-sm text-muted-foreground mt-2 truncate font-medium">
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

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeResultModal;
