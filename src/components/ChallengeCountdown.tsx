import { useEffect, useState } from "react";
import { Swords } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ChallengeCountdownProps {
  onComplete: () => void;
  subjectName?: string;
}

const ChallengeCountdown = ({ onComplete, subjectName }: ChallengeCountdownProps) => {
  const [count, setCount] = useState(3);
  const { playCountdownBeep, playCountdownFinal } = useSoundEffects();

  useEffect(() => {
    if (count > 0) {
      playCountdownBeep();
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      playCountdownFinal();
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [count, onComplete, playCountdownBeep, playCountdownFinal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center">
        {/* Animated background circles */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="w-[600px] h-[600px] rounded-full bg-accent/5 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 animate-ping" style={{ animationDuration: "1.5s" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Swords className="w-6 h-6 text-accent" />
            <span className="text-xl font-medium">Challenge Starting</span>
          </div>

          {subjectName && (
            <p className="text-lg text-muted-foreground">{subjectName}</p>
          )}

          {/* Countdown number */}
          <div className="relative">
            {count > 0 ? (
              <div
                key={count}
                className="text-[150px] font-black text-accent animate-in zoom-in-50 duration-300"
                style={{
                  textShadow: "0 0 60px hsl(var(--accent) / 0.5)",
                }}
              >
                {count}
              </div>
            ) : (
              <div
                className="text-6xl font-black text-primary animate-in zoom-in-75 duration-300"
                style={{
                  textShadow: "0 0 40px hsl(var(--primary) / 0.5)",
                }}
              >
                GO!
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">Get ready to answer!</p>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCountdown;
