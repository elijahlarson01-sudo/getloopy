import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Trophy, Medal, Swords, MessageCircle, Send } from "lucide-react";
import ChallengeModal from "@/components/ChallengeModal";
import { useToast } from "@/hooks/use-toast";

interface CohortMember {
  user_id: string;
  email: string;
  full_name: string | null;
  weekly_mastery_points: number;
  mastery_points: number;
}

interface CohortLeaderboardProps {
  userId: string;
}

const CohortLeaderboard = ({ userId }: CohortLeaderboardProps) => {
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [cohortId, setCohortId] = useState<string>("");
  const [cohortName, setCohortName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userWeeklyPoints, setUserWeeklyPoints] = useState(0);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<CohortMember | null>(null);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [dmRecipient, setDmRecipient] = useState<CohortMember | null>(null);
  const [dmMessage, setDmMessage] = useState("");
  const [sendingDm, setSendingDm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCohortMembers = async () => {
      // Get user's cohort
      const { data: userOnboarding } = await supabase
        .from("user_onboarding")
        .select("cohort_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!userOnboarding?.cohort_id) {
        setLoading(false);
        return;
      }

      setCohortId(userOnboarding.cohort_id);

      // Get cohort name
      const { data: cohort } = await supabase
        .from("cohorts")
        .select("degree_name")
        .eq("id", userOnboarding.cohort_id)
        .maybeSingle();

      if (cohort) {
        setCohortName(cohort.degree_name);
      }

      // Get all users in the same cohort with their progress
      const { data: cohortUsers } = await supabase
        .from("user_onboarding")
        .select("user_id")
        .eq("cohort_id", userOnboarding.cohort_id);

      if (!cohortUsers || cohortUsers.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = cohortUsers.map(u => u.user_id);

      // Get progress for these users
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("user_id, weekly_mastery_points, mastery_points")
        .in("user_id", userIds);

      // Try to get profiles (may be empty due to RLS or missing data)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      // Combine data - create entries for all users even without profiles
      const membersWithProgress: CohortMember[] = userIds.map((uid, index) => {
        const profile = profiles?.find(p => p.id === uid);
        const progress = progressData?.find(p => p.user_id === uid);
        return {
          user_id: uid,
          email: profile?.email || `Student ${index + 1}`,
          full_name: profile?.full_name || null,
          weekly_mastery_points: progress?.weekly_mastery_points || 0,
          mastery_points: progress?.mastery_points || 0,
        };
      });

      // Sort by weekly points
      membersWithProgress.sort((a, b) => b.weekly_mastery_points - a.weekly_mastery_points);
      setMembers(membersWithProgress);
      
      // Set user's weekly points for stake cap
      const myProgress = membersWithProgress.find(m => m.user_id === userId);
      if (myProgress) {
        setUserWeeklyPoints(myProgress.weekly_mastery_points);
      }
      
      setLoading(false);
    };

    fetchCohortMembers();
  }, [userId]);

  const handleChallengeClick = (member: CohortMember, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOpponent(member);
    setChallengeModalOpen(true);
  };

  const handleDmClick = (member: CohortMember, e: React.MouseEvent) => {
    e.stopPropagation();
    setDmRecipient(member);
    setDmMessage("");
    setDmModalOpen(true);
  };

  const handleSendDm = async () => {
    if (!dmRecipient || !dmMessage.trim() || !cohortId) return;
    
    setSendingDm(true);
    
    // Get current user's name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    
    const senderName = profile?.full_name || "Someone";
    const recipientName = dmRecipient.full_name || dmRecipient.email.split("@")[0];
    
    // Send as a system-style message that mentions the recipient
    const content = `💬 ${senderName} to ${recipientName}: "${dmMessage.trim().slice(0, 100)}"`;
    
    const { error } = await supabase.from("cohort_messages").insert({
      cohort_id: cohortId,
      user_id: userId,
      message_type: "user",
      content,
    });

    if (error) {
      toast({
        title: "Failed to send",
        description: "Could not send your message. Try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Message sent!",
        description: `Your message to ${recipientName} was posted to the cohort chat.`,
      });
      setDmModalOpen(false);
      setDmMessage("");
    }
    
    setSendingDm(false);
  };

  const handleChallengeCreated = (challengeId: string) => {
    navigate(`/challenges?start=${challengeId}`);
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/[0.02] to-transparent border border-border/50 shadow-sm h-full">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </Card>
    );
  }

  if (members.length === 0) {
    return null;
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="w-4 h-4 text-xs text-muted-foreground flex items-center justify-center">{index + 1}</span>;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/[0.02] to-transparent border border-border/50 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-lg flex-1">Your Cohort</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => navigate("/cohort")}
          title="Open cohort chat"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
      {cohortName && (
        <p className="text-sm text-muted-foreground mb-4">{cohortName}</p>
      )}
      <ScrollArea className="h-[280px]">
        <div className="space-y-2">
          {members.map((member, index) => (
            <div
              key={member.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                member.user_id === userId ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex-shrink-0 w-6 flex justify-center">
                {getRankIcon(index)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.full_name || member.email.split("@")[0]}
                  {member.user_id === userId && <span className="text-primary ml-1">(You)</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="text-right mr-1">
                  <p className="text-sm font-bold text-primary">{member.weekly_mastery_points}</p>
                  <p className="text-xs text-muted-foreground">pts/wk</p>
                </div>
                {member.user_id !== userId && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => handleDmClick(member, e)}
                      title="Send message"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-accent hover:text-accent hover:bg-accent/10"
                      onClick={(e) => handleChallengeClick(member, e)}
                      title="Challenge"
                    >
                      <Swords className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Challenge Modal */}
      {selectedOpponent && (
        <ChallengeModal
          open={challengeModalOpen}
          onOpenChange={setChallengeModalOpen}
          opponentId={selectedOpponent.user_id}
          opponentName={selectedOpponent.full_name || selectedOpponent.email.split("@")[0]}
          userId={userId}
          cohortId={cohortId}
          userWeeklyPoints={userWeeklyPoints}
          onChallengeCreated={handleChallengeCreated}
        />
      )}

      {/* DM Modal */}
      <Dialog open={dmModalOpen} onOpenChange={setDmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Message {dmRecipient?.full_name || dmRecipient?.email.split("@")[0]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your message will be posted to the cohort chat, visible to everyone.
            </p>
            <Input
              placeholder="Type your message... (100 chars max)"
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value.slice(0, 100))}
              maxLength={100}
              disabled={sendingDm}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDmModalOpen(false)} disabled={sendingDm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendDm} 
              disabled={!dmMessage.trim() || sendingDm}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendingDm ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CohortLeaderboard;
