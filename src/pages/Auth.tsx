import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Flame, ArrowRight, ChevronLeft, Star, Zap } from "lucide-react";

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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-40" />
      
      {/* Decorative doodles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-10 h-10 border-2 border-foreground rounded-full float opacity-15" />
        <div className="absolute top-20 right-16 w-8 h-8 border-2 border-foreground rotate-45 float opacity-15" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-20 w-12 h-12 border-2 border-foreground rounded-lg float opacity-15" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-32 right-10 w-6 h-6 border-2 border-foreground rounded-full float opacity-15" style={{ animationDelay: '0.5s' }} />
        
        {/* Squiggly lines */}
        <svg className="absolute top-1/3 left-6 w-12 h-6 opacity-15" viewBox="0 0 48 24">
          <path d="M0 12 Q12 0 24 12 T48 12" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground"/>
        </svg>
        <svg className="absolute bottom-1/3 right-6 w-12 h-6 opacity-15" viewBox="0 0 48 24">
          <path d="M0 12 Q12 24 24 12 T48 12" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground"/>
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="doodle-box p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-foreground rounded-xl flex items-center justify-center shadow-sketch sketch-hover">
                <Flame className="w-8 h-8 text-foreground" />
              </div>
              <Star className="absolute -top-2 -right-2 w-5 h-5 text-foreground wiggle" strokeWidth={2} />
            </div>
            <h1 className="font-display text-4xl mt-4 text-foreground">
              Loop
            </h1>
          </div>

          {/* Selection Mode */}
          {mode === "select" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-6">
                Ready to learn?
              </p>
              
              <button
                onClick={() => setMode("signup")}
                className="w-full sketch-card p-4 hover:shadow-sketch hover:-translate-x-1 hover:-translate-y-1 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-foreground rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-foreground" strokeWidth={2} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">I'm New Here</p>
                    <p className="text-sm text-muted-foreground">Create an account</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-foreground" />
              </button>

              <button
                onClick={() => setMode("login")}
                className="w-full sketch-card p-4 bg-foreground text-background hover:shadow-sketch hover:-translate-x-1 hover:-translate-y-1 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-background rounded-lg flex items-center justify-center bg-background">
                    <Zap className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Returning Learner</p>
                    <p className="text-sm opacity-70">Sign in to continue</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Login/Signup Form */}
          {(mode === "login" || mode === "signup") && (
            <>
              <button
                onClick={resetForm}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <p className="text-center text-muted-foreground mb-6">
                {mode === "login" 
                  ? "Welcome back! Sign in to continue." 
                  : "Create your account to get started."}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="font-medium text-sm">Display Name</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="How should we call you?"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="border-2 border-foreground shadow-sketch-sm focus:shadow-sketch h-11"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-2 border-foreground shadow-sketch-sm focus:shadow-sketch h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-medium text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="border-2 border-foreground shadow-sketch-sm focus:shadow-sketch h-11"
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading 
                    ? "Loading..." 
                    : mode === "login" 
                      ? "Sign In" 
                      : "Create Account"}
                  <ArrowRight className="ml-2 w-5 h-5" />
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