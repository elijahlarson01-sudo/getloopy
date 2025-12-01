import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Flame, Sparkles, ArrowRight, ChevronLeft, Star, Zap, Heart } from "lucide-react";

type AuthMode = "select" | "login" | "signup";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: onboarding } = await supabase
          .from("user_onboarding")
          .select("onboarding_completed")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (onboarding?.onboarding_completed) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const { data: onboarding } = await supabase
          .from("user_onboarding")
          .select("onboarding_completed")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        toast({
          title: "Welcome back!",
          description: "Good to see you again.",
        });
        
        if (onboarding?.onboarding_completed) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });

        if (error) throw error;

        // Create profile with first name
        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            email: email,
            full_name: firstName,
          });
        }

        toast({
          title: "Welcome to Loop!",
          description: "Let's get you set up.",
        });
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setMode("select");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 radiant-bg relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-12 h-12 bg-primary border-4 border-foreground rounded-full dance" />
        <div className="absolute top-20 right-16 w-8 h-8 bg-secondary border-4 border-foreground rotate-45 dance" style={{ animationDelay: '0.2s' }} />
        <div className="absolute bottom-20 left-20 w-10 h-10 bg-accent border-4 border-foreground dance" style={{ animationDelay: '0.3s' }} />
        <div className="absolute bottom-32 right-10 w-6 h-6 bg-pink border-4 border-foreground rounded-full dance" style={{ animationDelay: '0.4s' }} />
        
        {/* Motion lines */}
        <div className="absolute top-1/3 left-4 w-16 h-1 bg-foreground rounded-full" />
        <div className="absolute top-1/3 left-4 mt-2 w-12 h-1 bg-foreground rounded-full" />
        <div className="absolute bottom-1/3 right-4 w-16 h-1 bg-foreground rounded-full" />
        <div className="absolute bottom-1/3 right-4 mb-2 w-12 h-1 bg-foreground rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="pop-card bg-card p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-secondary border-4 border-foreground flex items-center justify-center shadow-pop bounce-hover">
                <Flame className="w-10 h-10 text-secondary-foreground" />
              </div>
              <Star className="absolute -top-3 -right-3 w-8 h-8 text-primary fill-primary animate-wiggle" />
            </div>
            <h1 className="font-display text-5xl mt-4 text-foreground tracking-wide">
              LOOP
            </h1>
          </div>

          {/* Selection Mode */}
          {mode === "select" && (
            <div className="space-y-4">
              <p className="text-center font-bold text-foreground mb-6">
                Ready to learn?
              </p>
              
              <button
                onClick={() => setMode("signup")}
                className="w-full pop-card p-5 bg-accent hover:-translate-x-1 hover:-translate-y-1 hover:shadow-pop-hover transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-card border-4 border-foreground flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-accent-foreground uppercase">I'm New Here</p>
                    <p className="text-sm text-accent-foreground/80">Create an account</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-accent-foreground" />
              </button>

              <button
                onClick={() => setMode("login")}
                className="w-full pop-card p-5 bg-primary hover:-translate-x-1 hover:-translate-y-1 hover:shadow-pop-hover transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-card border-4 border-foreground flex items-center justify-center">
                    <Zap className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-primary-foreground uppercase">Returning Learner</p>
                    <p className="text-sm text-primary-foreground/80">Sign in to continue</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-primary-foreground" />
              </button>
            </div>
          )}

          {/* Login/Signup Form */}
          {(mode === "login" || mode === "signup") && (
            <>
              <button
                onClick={resetForm}
                className="flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors mb-6 uppercase text-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              <p className="text-center font-bold text-foreground mb-6">
                {mode === "login" 
                  ? "Welcome back! Sign in to continue." 
                  : "Create your account to get started."}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="font-bold uppercase text-sm">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="How should we call you?"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="border-4 border-foreground bg-card shadow-pop-sm focus:shadow-pop h-12 font-semibold"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold uppercase text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-4 border-foreground bg-card shadow-pop-sm focus:shadow-pop h-12 font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold uppercase text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="border-4 border-foreground bg-card shadow-pop-sm focus:shadow-pop h-12 font-semibold"
                  />
                </div>

                <Button
                  type="submit"
                  variant={mode === "login" ? "default" : "accent"}
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading 
                    ? "Loading..." 
                    : mode === "login" 
                      ? "Sign In" 
                      : "Create Account"}
                  <Heart className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
