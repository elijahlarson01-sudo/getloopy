import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Swords, Zap, Trophy, X, Flame } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ChallengeNotificationProps {
  userId: string;
}

interface IncomingChallenge {
  id: string;
  challenger_name: string;
  subject_name: string;
  stake_points: number;
  is_revenge: boolean;
}

const ChallengeNotification = ({ userId }: ChallengeNotificationProps) => {
  const [challenge, setChallenge] = useState<IncomingChallenge | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { playChallengeReceived } = useSoundEffects();

  useEffect(() => {
    if (!userId) return;

    console.log("Setting up challenge notification listener for user:", userId);

    // Subscribe to new challenges where this user is the opponent
    const channel = supabase
      .channel(`challenge-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `opponent_user_id=eq.${userId}`
        },
        async (payload) => {
          console.log("Challenge notification received:", payload);
          const newChallenge = payload.new as any;
          
          // Fetch challenger name and subject
          const [profileRes, subjectRes] = await Promise.all([
            supabase.from("profiles").select("full_name, email").eq("id", newChallenge.challenger_user_id).single(),
            supabase.from("subjects").select("name").eq("id", newChallenge.subject_id).single()
          ]);

          const challengerName = profileRes.data?.full_name || profileRes.data?.email?.split("@")[0] || "Someone";
          const subjectName = subjectRes.data?.name || "Unknown Subject";
          const isRevenge = !!newChallenge.previous_challenge_id;

          console.log("Setting challenge state:", { challengerName, subjectName, stake_points: newChallenge.stake_points, isRevenge });

          // Play notification sound
          playChallengeReceived();

          setChallenge({
            id: newChallenge.id,
            challenger_name: challengerName,
            subject_name: subjectName,
            stake_points: newChallenge.stake_points,
            is_revenge: isRevenge
          });
          setOpen(true);
        }
      )
      .subscribe((status) => {
        console.log("Challenge notification channel status:", status);
      });

    return () => {
      console.log("Cleaning up challenge notification listener");
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handlePlayNow = () => {
    if (challenge) {
      setOpen(false);
      navigate(`/challenges?start=${challenge.id}`);
    }
  };

  const handleViewChallenges = () => {
    setOpen(false);
    navigate("/challenges");
  };

  const handleDismiss = () => {
    setOpen(false);
    setChallenge(null);
  };

  if (!open || !challenge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={handleDismiss}
      />
      
      {/* Modal content */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-card border-2 border-accent/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header with icon */}
        <div className={`p-8 text-center ${challenge.is_revenge ? 'bg-gradient-to-br from-destructive/20 to-accent/20' : 'bg-gradient-to-br from-accent/20 to-primary/20'}`}>
          {challenge.is_revenge && (
            <div className="inline-flex items-center gap-2 bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm font-bold mb-4">
              <Flame className="w-4 h-4" />
              Revenge Match
            </div>
          )}
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 animate-pulse ${challenge.is_revenge ? 'bg-destructive/20' : 'bg-accent/20'}`}>
            {challenge.is_revenge ? (
              <Flame className="w-12 h-12 text-destructive" />
            ) : (
              <Swords className="w-12 h-12 text-accent" />
            )}
          </div>
          <h2 className="text-3xl font-black text-foreground">
            {challenge.is_revenge ? "They Want Revenge!" : "You've Been Challenged!"}
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-center text-xl">
            <span className={challenge.is_revenge ? "text-destructive font-bold" : "text-accent font-bold"}>{challenge.challenger_name}</span>
            {challenge.is_revenge ? " is coming for payback!" : " wants to battle you!"}
          </p>
          
          {/* Challenge details */}
          <div className="bg-muted/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-base">Subject</span>
              <span className="font-semibold text-lg">{challenge.subject_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-base">Wager</span>
              <span className="font-bold text-accent flex items-center gap-2 text-lg">
                <Trophy className="w-6 h-6" />
                {challenge.stake_points} points
              </span>
            </div>
          </div>

          <p className="text-base text-center text-muted-foreground">
            Win to claim the points, lose and they're gone!
          </p>
        </div>
        
        {/* Actions */}
        <div className="p-6 pt-0 flex flex-col gap-3">
          <Button onClick={handlePlayNow} size="lg" className="w-full gap-2 text-xl font-bold h-14">
            <Zap className="w-6 h-6" />
            Play Now
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDismiss} className="flex-1 text-base">
              Later
            </Button>
            <Button variant="outline" onClick={handleViewChallenges} className="flex-1 text-base">
              View Challenges
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeNotification;