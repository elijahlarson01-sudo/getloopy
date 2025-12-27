import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Swords, Zap, Trophy } from "lucide-react";

interface ChallengeNotificationProps {
  userId: string;
}

interface IncomingChallenge {
  id: string;
  challenger_name: string;
  subject_name: string;
  stake_points: number;
}

const ChallengeNotification = ({ userId }: ChallengeNotificationProps) => {
  const [challenge, setChallenge] = useState<IncomingChallenge | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to new challenges where this user is the opponent
    const channel = supabase
      .channel('challenge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `opponent_user_id=eq.${userId}`
        },
        async (payload) => {
          const newChallenge = payload.new as any;
          
          // Fetch challenger name and subject
          const [profileRes, subjectRes] = await Promise.all([
            supabase.from("profiles").select("full_name, email").eq("id", newChallenge.challenger_user_id).single(),
            supabase.from("subjects").select("name").eq("id", newChallenge.subject_id).single()
          ]);

          const challengerName = profileRes.data?.full_name || profileRes.data?.email?.split("@")[0] || "Someone";
          const subjectName = subjectRes.data?.name || "Unknown Subject";

          setChallenge({
            id: newChallenge.id,
            challenger_name: challengerName,
            subject_name: subjectName,
            stake_points: newChallenge.stake_points
          });
          setOpen(true);
        }
      )
      .subscribe();

    return () => {
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

  if (!challenge) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Swords className="w-6 h-6 text-accent" />
            </div>
            <DialogTitle className="text-xl">Challenge Received!</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-foreground font-medium">
                <span className="text-accent font-bold">{challenge.challenger_name}</span> challenged you!
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{challenge.subject_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Wager</span>
                  <span className="font-bold text-accent flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {challenge.stake_points} points
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Win to claim the points, lose and they're gone!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Later
          </Button>
          <Button variant="outline" onClick={handleViewChallenges} className="flex-1">
            View Challenges
          </Button>
          <Button onClick={handlePlayNow} className="flex-1 gap-2">
            <Zap className="w-4 h-4" />
            Play Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeNotification;