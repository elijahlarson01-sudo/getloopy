import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChallengeNotification from "./ChallengeNotification";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Swords, Trophy, Clock, Flame, X } from "lucide-react";

interface PendingChallenge {
  id: string;
  challenger_name: string;
  subject_name: string;
  stake_points: number;
  is_revenge: boolean;
  created_at: string;
}

const GlobalChallengeProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [welcomeChallenge, setWelcomeChallenge] = useState<PendingChallenge | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Skip on auth and onboarding pages
  const isAuthPage = location.pathname === "/auth" || location.pathname === "/onboarding" || location.pathname === "/";

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Check for pending challenges on login (only on dashboard)
        if (location.pathname === "/dashboard") {
          await checkPendingChallenges(session.user.id);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setWelcomeChallenge(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  const checkPendingChallenges = async (uid: string) => {
    console.log("Checking pending challenges for user:", uid);
    
    // Get user's cohort first
    const { data: onboarding } = await supabase
      .from("user_onboarding")
      .select("cohort_id")
      .eq("user_id", uid)
      .single();

    if (!onboarding?.cohort_id) return;

    // Fetch most recent pending challenge where user is opponent
    const { data: challenges } = await supabase
      .from("challenges")
      .select(`
        id,
        challenger_user_id,
        stake_points,
        created_at,
        previous_challenge_id,
        subject_id
      `)
      .eq("opponent_user_id", uid)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (challenges && challenges.length > 0) {
      const challenge = challenges[0];
      
      // Check if user has already attempted this challenge
      const { data: attempt } = await supabase
        .from("challenge_attempts")
        .select("id")
        .eq("challenge_id", challenge.id)
        .eq("user_id", uid)
        .single();

      if (!attempt) {
        // Fetch additional info
        const [profileRes, subjectRes] = await Promise.all([
          supabase.from("profiles").select("full_name, email").eq("id", challenge.challenger_user_id).single(),
          supabase.from("subjects").select("name").eq("id", challenge.subject_id).single()
        ]);

        const challengerName = profileRes.data?.full_name || profileRes.data?.email?.split("@")[0] || "Someone";
        const subjectName = subjectRes.data?.name || "Unknown Subject";

        setWelcomeChallenge({
          id: challenge.id,
          challenger_name: challengerName,
          subject_name: subjectName,
          stake_points: challenge.stake_points,
          is_revenge: !!challenge.previous_challenge_id,
          created_at: challenge.created_at
        });
        setShowWelcome(true);
      }
    }
  };

  const handlePlayNow = () => {
    if (welcomeChallenge) {
      setShowWelcome(false);
      navigate(`/challenges?start=${welcomeChallenge.id}`);
    }
  };

  const handleViewChallenges = () => {
    setShowWelcome(false);
    navigate("/challenges");
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <>
      {children}
      
      {/* Real-time challenge notifications - works on any page */}
      {userId && !isAuthPage && (
        <ChallengeNotification userId={userId} />
      )}

      {/* Welcome back pending challenge modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <button 
            onClick={() => setShowWelcome(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Welcome Back!</DialogTitle>
          </DialogHeader>

          {welcomeChallenge && (
            <div className="py-4 space-y-5">
              {/* Header with icon */}
              <div className={`p-6 -mx-6 text-center ${welcomeChallenge.is_revenge ? 'bg-gradient-to-br from-destructive/20 to-accent/20' : 'bg-gradient-to-br from-accent/20 to-primary/20'}`}>
                {welcomeChallenge.is_revenge && (
                  <div className="inline-flex items-center gap-2 bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm font-bold mb-3">
                    <Flame className="w-4 h-4" />
                    Revenge Match
                  </div>
                )}
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${welcomeChallenge.is_revenge ? 'bg-destructive/20' : 'bg-accent/20'}`}>
                  {welcomeChallenge.is_revenge ? (
                    <Flame className="w-10 h-10 text-destructive" />
                  ) : (
                    <Swords className="w-10 h-10 text-accent" />
                  )}
                </div>
                <h2 className="text-2xl font-black text-foreground">
                  You Have a Pending Challenge!
                </h2>
                <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTimeAgo(welcomeChallenge.created_at)}
                </p>
              </div>

              {/* Challenge details */}
              <div className="space-y-4 px-2">
                <p className="text-center text-lg">
                  <span className={welcomeChallenge.is_revenge ? "text-destructive font-bold" : "text-accent font-bold"}>
                    {welcomeChallenge.challenger_name}
                  </span>
                  {welcomeChallenge.is_revenge ? " wants revenge!" : " challenged you!"}
                </p>

                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subject</span>
                    <span className="font-semibold">{welcomeChallenge.subject_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Wager</span>
                    <span className="font-bold text-accent flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      {welcomeChallenge.stake_points} points
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button onClick={handlePlayNow} size="lg" className="w-full gap-2 font-bold">
                  <Swords className="w-5 h-5" />
                  Play Now
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowWelcome(false)} className="flex-1">
                    Later
                  </Button>
                  <Button variant="outline" onClick={handleViewChallenges} className="flex-1">
                    View All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalChallengeProvider;
