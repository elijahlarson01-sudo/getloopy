import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Flame, Sparkles, ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur border-2">
        <div className="flex flex-col items-center mb-8">
          <Flame className="w-12 h-12 text-accent mb-4" />
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
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
              className={cn(
                "w-full p-5 rounded-xl border-2 border-border bg-card",
                "hover:border-primary/50 hover:bg-primary/5 transition-all duration-200",
                "flex items-center justify-between group"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">I'm New Here</p>
                  <p className="text-sm text-muted-foreground">Create an account</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <button
              onClick={() => setMode("login")}
              className={cn(
                "w-full p-5 rounded-xl border-2 border-border bg-card",
                "hover:border-primary/50 hover:bg-primary/5 transition-all duration-200",
                "flex items-center justify-between group"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Returning Learner</p>
                  <p className="text-sm text-muted-foreground">Sign in to continue</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        )}

        {/* Login/Signup Form */}
        {(mode === "login" || mode === "signup") && (
          <>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
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
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={loading}
              >
                {loading 
                  ? "Loading..." 
                  : mode === "login" 
                    ? "Sign In" 
                    : "Create Account"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default Auth;