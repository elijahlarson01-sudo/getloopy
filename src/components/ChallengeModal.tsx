import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Swords, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subject {
  id: string;
  name: string;
}

interface ChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponentId: string;
  opponentName: string;
  userId: string;
  cohortId: string;
  userWeeklyPoints: number;
  onChallengeCreated: (challengeId: string) => void;
}

const ChallengeModal = ({
  open,
  onOpenChange,
  opponentId,
  opponentName,
  userId,
  cohortId,
  userWeeklyPoints,
  onChallengeCreated,
}: ChallengeModalProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [stakePoints, setStakePoints] = useState<string>("10");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Calculate max stake (30% of weekly points, minimum 10)
  const maxStake = Math.max(10, Math.floor(userWeeklyPoints * 0.3));
  const stakeOptions = [10, 25, 50].filter(s => s <= maxStake);

  useEffect(() => {
    const fetchSubjects = async () => {
      // Get subjects that both users have in common (via cohort_subjects)
      const { data: cohortSubjects } = await supabase
        .from("cohort_subjects")
        .select("subject_id, subjects(id, name)")
        .eq("cohort_id", cohortId);

      if (cohortSubjects) {
        const subs = cohortSubjects
          .map((cs: any) => cs.subjects)
          .filter(Boolean);
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubject(subs[0].id);
        }
      }
    };

    if (open && cohortId) {
      fetchSubjects();
    }
  }, [open, cohortId]);

  const handleStartChallenge = async () => {
    if (!selectedSubject) {
      toast({
        title: "Select a subject",
        description: "Please choose a subject for the challenge.",
        variant: "destructive",
      });
      return;
    }

    const stake = parseInt(stakePoints);
    if (stake > userWeeklyPoints) {
      toast({
        title: "Not enough points",
        description: "You don't have enough weekly points to stake.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Create the challenge
    const { data: challenge, error } = await supabase
      .from("challenges")
      .insert({
        challenger_user_id: userId,
        opponent_user_id: opponentId,
        cohort_id: cohortId,
        subject_id: selectedSubject,
        stake_points: stake,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating challenge:", error);
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Challenge created!",
      description: "Get ready for your Lightning Round!",
    });

    setLoading(false);
    onOpenChange(false);
    onChallengeCreated(challenge.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-accent" />
            Challenge {opponentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Opponent Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-lg font-bold text-accent">
                {opponentName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{opponentName}</p>
              <p className="text-sm text-muted-foreground">1v1 Lightning Round</p>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Point Wager */}
          <div className="space-y-2">
            <Label>Points to Wager</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Max stake: {maxStake} pts (30% of your weekly points)
            </p>
            <RadioGroup
              value={stakePoints}
              onValueChange={setStakePoints}
              className="flex gap-4"
            >
              {stakeOptions.map((stake) => (
                <div key={stake} className="flex items-center space-x-2">
                  <RadioGroupItem value={stake.toString()} id={`stake-${stake}`} />
                  <Label htmlFor={`stake-${stake}`} className="cursor-pointer">
                    {stake} pts
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleStartChallenge}
            disabled={loading || !selectedSubject}
            className="w-full gap-2"
            size="lg"
          >
            <Zap className="w-4 h-4" />
            {loading ? "Creating..." : "Start Lightning Round"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeModal;
