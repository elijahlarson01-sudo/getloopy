import { Button } from "@/components/ui/button";
import { Flame, Brain, Zap, Star, Sparkles, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Subtle dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-50" />
      
      {/* Decorative doodle shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Simple geometric doodles */}
        <div className="absolute top-20 left-10 w-12 h-12 border-2 border-foreground rounded-full float opacity-20" />
        <div className="absolute top-32 right-20 w-8 h-8 border-2 border-foreground rotate-45 float opacity-20" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-10 h-10 border-2 border-foreground rounded-lg float opacity-20" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-16 w-6 h-6 border-2 border-foreground rounded-full float opacity-20" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 right-1/4 w-14 h-14 border-2 border-foreground float opacity-15" style={{ animationDelay: '1.5s' }} />
        
        {/* Squiggly lines */}
        <svg className="absolute top-1/4 left-8 w-16 h-8 opacity-20" viewBox="0 0 64 32">
          <path d="M0 16 Q16 0 32 16 T64 16" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground"/>
        </svg>
        <svg className="absolute bottom-1/4 right-8 w-16 h-8 opacity-20" viewBox="0 0 64 32">
          <path d="M0 16 Q16 32 32 16 T64 16" stroke="currentColor" strokeWidth="2" fill="none" className="text-foreground"/>
        </svg>
      </div>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 py-20">
        <div className="container max-w-3xl mx-auto relative z-10">
          <div className="text-center space-y-10">
            {/* Icon row */}
            <div className="flex justify-center gap-6 mb-8">
              <div className="doodle-box w-14 h-14 flex items-center justify-center sketch-hover">
                <Brain className="w-7 h-7" />
              </div>
              <div className="doodle-box w-14 h-14 flex items-center justify-center sketch-hover" style={{ transform: 'rotate(2deg)' }}>
                <Flame className="w-7 h-7" />
              </div>
              <div className="doodle-box w-14 h-14 flex items-center justify-center sketch-hover" style={{ transform: 'rotate(-1deg)' }}>
                <Zap className="w-7 h-7" />
              </div>
            </div>

            {/* Main title */}
            <div className="relative inline-block">
              <h1 className="font-display text-8xl md:text-9xl tracking-tight text-foreground">
                Loop
              </h1>
              {/* Decorative stars */}
              <Star className="absolute -top-2 -right-6 w-6 h-6 text-foreground wiggle" strokeWidth={2} />
              <Sparkles className="absolute -bottom-1 -left-4 w-5 h-5 text-foreground wiggle" style={{ animationDelay: '1.5s' }} strokeWidth={2} />
            </div>
            
            <p className="font-sketch text-3xl md:text-4xl text-foreground tilt-1">
              Embracing the Change in Learning!
            </p>
            
            <div className="sketch-card p-6 max-w-xl mx-auto tilt-2">
              <p className="text-lg text-foreground/80 leading-relaxed">
                Transform how you learn with bite-sized daily practice. Master SQL, Python, R, and more through gamified repetition that actually sticks!
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button variant="default" size="xl" asChild>
                <a href="/auth">
                  Get Started
                  <ArrowRight className="ml-1" />
                </a>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <a href="/auth">
                  Sign In
                </a>
              </Button>
            </div>

            {/* Subject tags */}
            <div className="flex flex-wrap justify-center gap-3 pt-8">
              {['SQL', 'Python', 'R', 'Spanish'].map((subject, i) => (
                <span 
                  key={subject}
                  className="sketch-card px-4 py-2 text-sm font-medium"
                  style={{ transform: `rotate(${i % 2 === 0 ? '-1' : '1'}deg)` }}
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-6 border-t-2 border-foreground bg-background">
        <div className="container max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2025 Loop. Built by Elijah Larson</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;