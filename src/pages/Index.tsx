import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Target, 
  Trophy, 
  Users, 
  Zap, 
  Brain,
  Code,
  BookOpen,
  TrendingUp,
  Award,
  CheckCircle2,
  Lock
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              Master anything with
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                Loop
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Turn complex subjects into addictive daily practice. Build streaks, compete with peers, and retain knowledge like never before.
            </p>
            
            <div className="flex justify-center pt-4">
              <Button variant="gradient" size="lg" asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-4 py-16 md:py-24">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Your Daily Learning Loop
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              5-10 minutes a day. Built-in accountability. Visible progress.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Streak Card */}
            <Card className="p-8 bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20 hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                  <h3 className="text-5xl font-black text-foreground mt-1">42</h3>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
                  <Flame className="w-16 h-16 text-accent relative z-10" />
                </div>
              </div>
              <Progress value={85} className="h-3 bg-accent/20" />
              <p className="text-sm text-muted-foreground mt-3">
                15 days until Legendary status 🏆
              </p>
            </Card>

            {/* Mastery Points Card */}
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mastery Points</p>
                  <h3 className="text-5xl font-black text-foreground mt-1">2,847</h3>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <Brain className="w-16 h-16 text-primary relative z-10" />
                </div>
              </div>
              <Progress value={68} className="h-3 bg-primary/20" />
              <p className="text-sm text-muted-foreground mt-3">
                Rank #3 in your cohort 🎯
              </p>
            </Card>
          </div>

          {/* Skill Tree Preview */}
          <Card className="mt-6 p-8 bg-card/50 backdrop-blur border-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">SQL Mastery</h3>
                <p className="text-muted-foreground">Continue your learning path</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                68% Complete
              </Badge>
            </div>

            <div className="grid gap-4">
              {/* Module 1 - Completed */}
              <div className="flex items-center gap-4 p-4 bg-success/10 border-2 border-success/30 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-success-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground">Basic SELECT Queries</h4>
                  <p className="text-sm text-muted-foreground">Mastered • 95% accuracy</p>
                </div>
                <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
              </div>

              {/* Module 2 - In Progress */}
              <div className="flex items-center gap-4 p-4 bg-primary/10 border-2 border-primary/40 rounded-2xl ring-2 ring-primary/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground">JOINs & Relations</h4>
                  <Progress value={45} className="h-2 mt-2 bg-primary/20" />
                  <p className="text-sm text-muted-foreground mt-1">4 of 9 lessons • Continue practice</p>
                </div>
                <Button size="sm" variant="gradient">
                  Practice
                </Button>
              </div>

              {/* Module 3 - Locked */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 border-2 border-border rounded-2xl opacity-60">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-muted-foreground">Window Functions</h4>
                  <p className="text-sm text-muted-foreground">Complete JOINs to unlock</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to master complex topics
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/30">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Spaced Repetition</h3>
              <p className="text-muted-foreground">
                Our Retention Gauge ensures you never forget what you've learned. Auto-reviews keep knowledge fresh.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-accent/30">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Competitive Leaderboards</h3>
              <p className="text-muted-foreground">
                Join cohorts with classmates. Compete on shared content. Weekly rankings keep motivation high.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-success/30">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Custom Content</h3>
              <p className="text-muted-foreground">
                Upload PDFs, slides, or generate with AI. Turn any material into an engaging learning path.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="container max-w-4xl mx-auto">
          <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-2 border-primary/20">
            <Award className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to build your streak?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of learners mastering SQL, R, Python, legal concepts, and more through gamified daily practice.
            </p>
            <Button variant="gradient" size="lg" className="text-lg">
              Start Your First Loop
              <Flame className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Loop. Built to help you retain what you learn.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
