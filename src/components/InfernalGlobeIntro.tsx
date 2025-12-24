import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Skull } from 'lucide-react';
import wizardCrystalBall from '@/assets/wizard-crystal-ball.png';

interface InfernalGlobeIntroProps {
  onEnter: () => void;
}

export function InfernalGlobeIntro({ onEnter }: InfernalGlobeIntroProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-black via-[#1a0000] to-black">
      {/* Animated blood vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#0a0000]" />
      
      {/* Particle field */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              boxShadow: '0 0 10px rgba(220, 20, 60, 0.5)',
            }}
          />
        ))}
      </div>

      {/* Rotating demon globe - large centerpiece */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative w-[900px] h-[900px] transition-transform duration-100 ease-linear"
          style={{
            transform: `perspective(1200px) rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Pulsing glow for the crystal ball in wizard's right hand */}
          <div className="absolute top-[35%] right-[20%] w-64 h-64 rounded-full bg-primary/60 blur-3xl animate-pulse" 
               style={{ animationDuration: '1.5s' }} />
          <div className="absolute top-[35%] right-[20%] w-48 h-48 rounded-full bg-orange-500/40 blur-2xl animate-pulse" 
               style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          
          {/* Glowing crystal ball aura */}
          <div className="absolute top-[35%] right-[20%] w-32 h-32 rounded-full bg-white/30 blur-xl animate-pulse" 
               style={{ animationDuration: '1s' }} />
          
          {/* Main wizard image */}
          <img
            src={wizardCrystalBall}
            alt="Dark Wizard with Crystal Ball"
            className="w-full h-full object-contain relative z-10"
            style={{
              filter: 'brightness(1.1) contrast(1.2) drop-shadow(0 0 80px rgba(220, 20, 60, 0.9))',
            }}
          />
          
          {/* Animated fire particles around the image */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <div
                key={`inner-flame-${i}`}
                className="absolute w-3 h-3 bg-gradient-to-t from-primary via-orange-500 to-yellow-400 rounded-full"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${60 + Math.random() * 30}%`,
                  animation: `flicker-rise ${1 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: 0.8,
                  boxShadow: '0 0 20px rgba(255, 100, 0, 0.8)',
                }}
              />
            ))}
          </div>
          
          {/* Glowing aura rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[1000px] h-[1000px] rounded-full border-2 border-primary/20 animate-pulse" 
                 style={{ animationDuration: '3s' }} />
            <div className="absolute w-[1100px] h-[1100px] rounded-full border border-orange-500/10 animate-pulse" 
                 style={{ animationDuration: '4s', animationDelay: '1s' }} />
          </div>
        </div>
      </div>

      {/* Flame particles rising */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`flame-${i}`}
            className="absolute bottom-0 w-2 h-2 bg-primary rounded-full"
            style={{
              left: `${20 + Math.random() * 60}%`,
              animation: `float-up ${5 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.6,
              boxShadow: '0 0 20px rgba(220, 20, 60, 0.8)',
            }}
          />
        ))}
      </div>

      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-20 pointer-events-none">
        {/* Top skull decoration */}
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <Skull className="w-12 h-12 text-primary drop-shadow-[0_0_20px_rgba(220,20,60,0.8)] animate-pulse" />
          <div className="w-32 h-0.5 bg-gradient-to-l from-transparent via-primary to-transparent" />
        </div>

        {/* Center text and button */}
        <div className="text-center pointer-events-auto space-y-8 z-10">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-7xl font-bold font-serif tracking-wider">
              <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                Enter the
              </span>
            </h1>
            <h2 className="text-8xl font-black font-serif tracking-wide bg-gradient-to-r from-primary via-[#ff6b6b] to-primary bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(220,20,60,1)] animate-pulse">
              Infernal Realm
            </h2>
          </div>
          
          <p className="text-2xl text-muted-foreground font-serif italic animate-fade-in drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" 
             style={{ animationDelay: '0.3s' }}>
            The demon lord of the abyss awaits...
          </p>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button 
              onClick={onEnter}
              size="lg"
              className="relative px-12 py-8 text-xl font-bold overflow-hidden group bg-gradient-to-r from-primary via-[#8b0000] to-primary hover:scale-105 transition-all duration-300 border-2 border-primary/50 shadow-[0_0_40px_rgba(220,20,60,0.6)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Flame className="mr-3 h-6 w-6 animate-pulse group-hover:scale-125 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Build Your Castle</span>
            </Button>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="w-full max-w-2xl h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-fade-in opacity-50" 
             style={{ animationDelay: '0.9s' }} />
      </div>

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scale(0.3);
            opacity: 0;
          }
        }
        
        @keyframes flicker-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          25% {
            opacity: 1;
            transform: translateY(-20px) scale(1.2);
          }
          50% {
            opacity: 0.6;
            transform: translateY(-40px) scale(0.9);
          }
          75% {
            opacity: 0.9;
            transform: translateY(-60px) scale(1.1);
          }
          100% {
            transform: translateY(-80px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
