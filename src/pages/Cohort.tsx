import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, MessageCircle, Send, Trophy, Zap, Flame, Crown } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface CohortMember {
  user_id: string;
  full_name: string | null;
  weekly_mastery_points: number;
  mastery_points: number;
  current_streak: number;
}

interface ChatMessage {
  id: string;
  user_id: string | null;
  message_type: "user" | "system";
  content: string;
  created_at: string;
  sender_name?: string;
}

const quickReactions = [
  { text: "Rematch?", emoji: "⚔️" },
  { text: "GG", emoji: "🤝" },
  { text: "Lucky win", emoji: "🍀" },
  { text: "Let's go!", emoji: "🔥" },
  { text: "Nice one", emoji: "👏" },
];

const Cohort = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [cohortName, setCohortName] = useState<string>("");
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchCohortData(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchCohortData = async (userId: string) => {
    setLoading(true);
    
    // Get user's cohort
    const { data: onboarding } = await supabase
      .from("user_onboarding")
      .select("cohort_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!onboarding?.cohort_id) {
      setLoading(false);
      return;
    }

    setCohortId(onboarding.cohort_id);

    // Get cohort name
    const { data: cohort } = await supabase
      .from("cohorts")
      .select("degree_name")
      .eq("id", onboarding.cohort_id)
      .single();

    if (cohort) {
      setCohortName(cohort.degree_name);
    }

    // Fetch members with their progress
    await fetchMembers(onboarding.cohort_id);
    await fetchMessages(onboarding.cohort_id);
    
    setLoading(false);
  };

  const fetchMembers = async (cohortId: string) => {
    // Get all users in this cohort
    const { data: cohortUsers } = await supabase
      .from("user_onboarding")
      .select("user_id")
      .eq("cohort_id", cohortId);

    if (!cohortUsers?.length) return;

    const userIds = cohortUsers.map(u => u.user_id);

    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    // Get progress
    const { data: progress } = await supabase
      .from("user_progress")
      .select("user_id, weekly_mastery_points, mastery_points, current_streak")
      .in("user_id", userIds);

    const memberList: CohortMember[] = userIds.map(uid => {
      const profile = profiles?.find(p => p.id === uid);
      const prog = progress?.find(p => p.user_id === uid);
      return {
        user_id: uid,
        full_name: profile?.full_name || null,
        weekly_mastery_points: prog?.weekly_mastery_points || 0,
        mastery_points: prog?.mastery_points || 0,
        current_streak: prog?.current_streak || 0,
      };
    });

    // Sort by weekly points
    memberList.sort((a, b) => b.weekly_mastery_points - a.weekly_mastery_points);
    setMembers(memberList);
  };

  const fetchMessages = async (cohortId: string) => {
    const { data: msgs } = await supabase
      .from("cohort_messages")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!msgs) return;

    // Get sender names for user messages
    const userIds = [...new Set(msgs.filter(m => m.user_id).map(m => m.user_id!))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const enrichedMessages: ChatMessage[] = msgs.map(m => ({
      ...m,
      message_type: m.message_type as "user" | "system",
      sender_name: m.user_id 
        ? profiles?.find(p => p.id === m.user_id)?.full_name || "Anonymous"
        : undefined,
    }));

    setMessages(enrichedMessages);
  };

  // Subscribe to realtime messages
  useEffect(() => {
    if (!cohortId) return;

    const channel = supabase
      .channel(`cohort-chat-${cohortId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cohort_messages",
          filter: `cohort_id=eq.${cohortId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Get sender name if user message
          let senderName: string | undefined;
          if (newMsg.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newMsg.user_id)
              .single();
            senderName = profile?.full_name || "Anonymous";
          }

          setMessages(prev => [...prev, {
            ...newMsg,
            message_type: newMsg.message_type as "user" | "system",
            sender_name: senderName,
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cohortId]);

  const sendMessage = async (text: string) => {
    if (!user || !cohortId || !text.trim() || sending) return;
    
    const content = text.trim().slice(0, 140);
    setSending(true);
    setNewMessage("");

    const { error } = await supabase.from("cohort_messages").insert({
      cohort_id: cohortId,
      user_id: user.id,
      message_type: "user",
      content,
    });

    if (error) {
      toast({
        title: "Failed to send",
        description: "Could not send your message. Try again.",
        variant: "destructive",
      });
      setNewMessage(content);
    }

    setSending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading cohort...</p>
      </div>
    );
  }

  if (!cohortId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">You're not part of a cohort yet.</p>
        <Button onClick={() => navigate("/onboarding")}>Complete Onboarding</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Your Cohort</h1>
            <p className="text-sm text-muted-foreground">{cohortName}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{members.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-4">
        <Tabs defaultValue="chat" className="h-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex flex-col h-[calc(100vh-220px)]">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No messages yet.</p>
                      <p className="text-sm">Be the first to say something!</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.message_type === "system" ? "justify-center" : ""
                      }`}
                    >
                      {msg.message_type === "system" ? (
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className={`text-xs ${
                              msg.user_id === user?.id 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-accent/20 text-accent"
                            }`}>
                              {getInitials(msg.sender_name || null)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-sm">
                                {msg.user_id === user?.id ? "You" : msg.sender_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 break-words">
                              {msg.content}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Quick Reactions */}
              <div className="border-t border-border p-2 flex gap-2 overflow-x-auto">
                {quickReactions.map((reaction) => (
                  <Button
                    key={reaction.text}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-xs h-8"
                    onClick={() => sendMessage(reaction.text)}
                    disabled={sending}
                  >
                    {reaction.emoji} {reaction.text}
                  </Button>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
                <Input
                  placeholder="Say something... (140 chars max)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value.slice(0, 140))}
                  className="flex-1"
                  maxLength={140}
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="h-[calc(100vh-220px)]">
            <Card className="h-full overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        member.user_id === user?.id
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/30 hover:bg-muted/50"
                      } transition-colors`}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`${
                            index === 0 
                              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                              : index === 1
                              ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white"
                              : index === 2
                              ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                              : "bg-muted"
                          }`}>
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1">
                            {index === 0 && <Crown className="w-4 h-4 text-amber-500" />}
                            {index === 1 && <Trophy className="w-3 h-3 text-slate-400" />}
                            {index === 2 && <Trophy className="w-3 h-3 text-amber-700" />}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {member.full_name || "Anonymous"}
                          {member.user_id === user?.id && (
                            <span className="text-primary ml-2 text-sm font-normal">(you)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-primary" />
                            {member.weekly_mastery_points} weekly
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-accent" />
                            {member.current_streak} streak
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">#{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Cohort;
