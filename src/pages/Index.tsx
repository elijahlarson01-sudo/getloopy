import { Button } from "@/components/ui/button";
import { Flame, Brain, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        <div className="container max-w-4xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-accent" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-success" />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                Loop
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold text-foreground">
              Embracing the Change in Learning
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform how you learn with bite-sized daily practice. Master SQL, Python, R, and more through gamified repetition that actually sticks.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Button variant="gradient" size="lg" asChild>
                <a href="/auth">
                  Get Started
                  <Flame className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Loop. Built by Elijah Larson</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
