import { Button } from "@/components/ui/button";
import { Flame, Brain, Zap, Star, Heart, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden radiant-bg">
      {/* Decorative floating shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Dancing figures inspired by Haring */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-primary border-4 border-foreground rounded-full dance" />
        <div className="absolute top-40 right-20 w-12 h-12 bg-secondary border-4 border-foreground rotate-45 dance" style={{ animationDelay: '0.2s' }} />
        <div className="absolute bottom-32 left-1/4 w-14 h-14 bg-accent border-4 border-foreground dance" style={{ animationDelay: '0.4s' }} />
        <div className="absolute top-1/3 right-10 w-10 h-10 bg-success border-4 border-foreground rounded-full dance" style={{ animationDelay: '0.1s' }} />
        <div className="absolute bottom-40 right-1/3 w-8 h-8 bg-pink border-4 border-foreground rotate-12 dance" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-60 left-1/3 w-6 h-6 bg-orange border-4 border-foreground rounded-full dance" style={{ animationDelay: '0.5s' }} />
        
        {/* Motion lines */}
        <div className="absolute top-1/4 left-5 w-20 h-1 bg-foreground rounded-full" />
        <div className="absolute top-1/4 left-5 mt-2 w-16 h-1 bg-foreground rounded-full" />
        <div className="absolute top-1/4 left-5 mt-4 w-12 h-1 bg-foreground rounded-full" />
        
        <div className="absolute bottom-1/4 right-5 w-20 h-1 bg-foreground rounded-full" />
        <div className="absolute bottom-1/4 right-5 mb-2 w-16 h-1 bg-foreground rounded-full" />
        <div className="absolute bottom-1/4 right-5 mb-4 w-12 h-1 bg-foreground rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 py-20">
        <div className="container max-w-4xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            {/* Icon figures */}
            <div className="flex justify-center gap-4 mb-8">
              <div className="pop-card w-16 h-16 bg-primary flex items-center justify-center bounce-hover">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="pop-card w-16 h-16 bg-secondary flex items-center justify-center bounce-hover" style={{ animationDelay: '0.1s' }}>
                <Flame className="w-8 h-8 text-secondary-foreground" />
              </div>
              <div className="pop-card w-16 h-16 bg-accent flex items-center justify-center bounce-hover" style={{ animationDelay: '0.2s' }}>
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
            </div>

            {/* Main title */}
            <div className="relative inline-block">
              <h1 className="font-display text-8xl md:text-9xl tracking-wider text-foreground">
                LOOP
              </h1>
              {/* Decorative stars */}
              <Star className="absolute -top-4 -right-8 w-8 h-8 text-secondary fill-secondary animate-wiggle" />
              <Sparkles className="absolute -bottom-2 -left-6 w-6 h-6 text-pink fill-pink animate-wiggle" style={{ animationDelay: '0.2s' }} />
            </div>
            
            <p className="font-marker text-2xl md:text-3xl text-foreground rotate-[-1deg]">
              Embracing the Change in Learning!
            </p>
            
            <div className="pop-card bg-card p-6 max-w-2xl mx-auto">
              <p className="text-lg text-foreground leading-relaxed font-semibold">
                Transform how you learn with bite-sized daily practice. Master SQL, Python, R, and more through gamified repetition that actually sticks!
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Button variant="default" size="xl" asChild>
                <a href="/auth">
                  Get Started
                  <Flame className="ml-2" />
                </a>
              </Button>
              <Button variant="accent" size="xl" asChild>
                <a href="/auth">
                  Sign In
                  <Heart className="ml-2" />
                </a>
              </Button>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-8">
              {['SQL', 'Python', 'R', 'Spanish'].map((subject, i) => (
                <span 
                  key={subject}
                  className={`pop-card px-4 py-2 text-sm font-bold uppercase ${
                    i === 0 ? 'bg-primary text-primary-foreground' :
                    i === 1 ? 'bg-accent text-accent-foreground' :
                    i === 2 ? 'bg-success text-success-foreground' :
                    'bg-pink text-pink-foreground'
                  }`}
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-6 border-t-4 border-foreground bg-card">
        <div className="container max-w-6xl mx-auto text-center">
          <p className="font-bold text-foreground">© 2025 Loop. Built by Elijah Larson</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
