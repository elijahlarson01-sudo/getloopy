import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Trophy, Medal, Star } from "lucide-react";

interface CohortMember { user_id: string; email: string; full_name: string | null; weekly_mastery_points: number; mastery_points: number; }
interface CohortLeaderboardProps { userId: string; }

const CohortLeaderboard = ({ userId }: CohortLeaderboardProps) => {
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [cohortName, setCohortName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCohortMembers = async () => {
      const { data: userOnboarding } = await supabase.from("user_onboarding").select("cohort_id").eq("user_id", userId).maybeSingle();
      if (!userOnboarding?.cohort_id) { setLoading(false); return; }
      const { data: cohort } = await supabase.from("cohorts").select("degree_name").eq("id", userOnboarding.cohort_id).maybeSingle();
      if (cohort) setCohortName(cohort.degree_name);
      const { data: cohortUsers } = await supabase.from("user_onboarding").select("user_id").eq("cohort_id", userOnboarding.cohort_id);
      if (!cohortUsers || cohortUsers.length === 0) { setLoading(false); return; }
      const userIds = cohortUsers.map(u => u.user_id);
      const { data: progressData } = await supabase.from("user_progress").select("user_id, weekly_mastery_points, mastery_points").in("user_id", userIds);
      const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", userIds);
      const membersWithProgress: CohortMember[] = userIds.map((uid, index) => {
        const profile = profiles?.find(p => p.id === uid);
        const progress = progressData?.find(p => p.user_id === uid);
        return { user_id: uid, email: profile?.email || `Student ${index + 1}`, full_name: profile?.full_name || null, weekly_mastery_points: progress?.weekly_mastery_points || 0, mastery_points: progress?.mastery_points || 0 };
      });
      membersWithProgress.sort((a, b) => b.weekly_mastery_points - a.weekly_mastery_points);
      setMembers(membersWithProgress);
      setLoading(false);
    };
    fetchCohortMembers();
  }, [userId]);

  if (loading) return <Card className="p-6"><div className="animate-pulse space-y-3"><div className="h-5 bg-muted w-1/3 rounded"></div><div className="h-4 bg-muted w-full rounded"></div></div></Card>;
  if (members.length === 0) return null;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5" />;
    if (index === 1) return <Medal className="w-5 h-5 opacity-60" />;
    if (index === 2) return <Medal className="w-5 h-5 opacity-40" />;
    return <span className="w-5 h-5 text-sm flex items-center justify-center">{index + 1}</span>;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5" />
        <h3 className="font-display text-lg">Your Cohort</h3>
      </div>
      {cohortName && <p className="text-sm text-muted-foreground mb-4">{cohortName}</p>}
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {members.map((member, index) => (
            <div key={member.user_id} className={`flex items-center gap-3 p-3 border-2 border-foreground rounded-lg transition-all ${member.user_id === userId ? "bg-foreground text-background" : "hover:shadow-sketch-sm hover:-translate-x-0.5 hover:-translate-y-0.5"}`}>
              <div className="flex-shrink-0 w-6 flex justify-center">{getRankIcon(index)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.full_name || member.email.split("@")[0]}
                  {member.user_id === userId && <Star className="inline w-4 h-4 ml-1" />}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{member.weekly_mastery_points}</p>
                <p className="text-xs opacity-60">pts/wk</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default CohortLeaderboard;