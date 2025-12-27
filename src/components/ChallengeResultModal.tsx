import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Minus, XCircle, RotateCcw, Clock } from "lucide-react";

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

  const myName = isChallenger ? challenge.challenger_name : challenge.opponent_name;
  const opponentName = isChallenger ? challenge.opponent_name : challenge.challenger_name;

  const myAttempt = challenge.my_attempt;
  const opponentAttempt = challenge.opponent_attempt;

  const getResultColor = () => {
    if (isDraw) return "text-muted-foreground";
    if (isWinner) return "text-success";
    return "text-destructive";
  };

  const getResultIcon = () => {
    if (isDraw) return <Minus className="w-16 h-16 text-muted-foreground" />;
    if (isWinner) return <Trophy className="w-16 h-16 text-yellow-500" />;
    return <XCircle className="w-16 h-16 text-destructive" />;
  };

  const getResultText = () => {
    if (isDraw) return "It's a Draw!";
    if (isWinner) return "You Won!";
    return "You Lost";
  };

  const getPointsText = () => {
    if (isDraw) return "No points exchanged";
    if (isWinner) return `+${challenge.stake_points} points`;
    return `-${challenge.stake_points} points`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Challenge Result</DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Result Icon */}
          <div className="flex flex-col items-center">
            {getResultIcon()}
            <h2 className={`text-2xl font-bold mt-4 ${getResultColor()}`}>
              {getResultText()}
            </h2>
            <p className={`text-lg font-medium ${getResultColor()}`}>
              {getPointsText()}
            </p>
          </div>

          {/* Score Comparison */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Your Score */}
            <div className="text-center">
              <div className={`text-4xl font-black ${isWinner ? 'text-success' : isDraw ? 'text-foreground' : 'text-muted-foreground'}`}>
                {myAttempt?.score ?? "-"}
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
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
              <div className={`text-4xl font-black ${!isWinner && !isDraw ? 'text-success' : isDraw ? 'text-foreground' : 'text-muted-foreground'}`}>
                {opponentAttempt?.score ?? "-"}
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
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
          <p className="text-center text-sm text-muted-foreground">
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
