import { useEffect, useState } from 'react';

interface FloatingNumber {
  id: number;
  x: number;
  delay: number;
  drift: number;
}

interface InfernalReactionProps {
  onComplete?: () => void;
}

export function InfernalReaction({ onComplete }: InfernalReactionProps) {
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);

  useEffect(() => {
    // Create three "6" characters with staggered timing and enhanced ambient drift
    const newNumbers = [
      { id: 0, x: -30, delay: 0, drift: -20 },
      { id: 1, x: 0, delay: 250, drift: 10 },
      { id: 2, x: 30, delay: 500, drift: -30 }
    ];
    
    setNumbers(newNumbers);

    // Clean up after animation completes
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {numbers.map((num) => (
        <div
          key={num.id}
          className="absolute"
          style={{
            left: `calc(50% + ${num.x}px)`,
            animation: `infernal-float-drift 3.5s ease-out forwards`,
            animationDelay: `${num.delay}ms`,
            '--drift-x': `${num.drift}px`,
          } as React.CSSProperties}
        >
          <span 
            className="text-[140px] font-black select-none inline-block"
            style={{
              fontFamily: "'Cinzel', 'Playfair Display', serif",
              color: '#DC143C',
              textShadow: `
                0 0 25px rgba(220, 20, 60, 0.9),
                0 0 50px rgba(220, 20, 60, 0.7),
                0 0 75px rgba(220, 20, 60, 0.5),
                4px 4px 8px rgba(0, 0, 0, 0.95),
                -2px -2px 4px rgba(139, 0, 0, 0.9)
              `,
              filter: 'drop-shadow(0 0 35px rgba(220, 20, 60, 0.8))',
              animation: `flicker-infernal 0.2s ease-in-out ${num.delay}ms 1, pulse-glow 2s ease-in-out infinite ${num.delay}ms`,
            }}
          >
            6
          </span>
        </div>
      ))}
      <style>
        {`
          @keyframes infernal-float-drift {
            0% {
              transform: translateY(0) scale(0.3);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            80% {
              opacity: 0.9;
            }
            100% {
              transform: translateY(-400px) translateX(var(--drift-x)) scale(1.2);
              opacity: 0;
            }
          }
          @keyframes flicker-infernal {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes pulse-glow {
            0%, 100% {
              filter: drop-shadow(0 0 35px rgba(220, 20, 60, 0.8));
            }
            50% {
              filter: drop-shadow(0 0 50px rgba(220, 20, 60, 1));
            }
          }
        `}
      </style>
    </div>
  );
}
