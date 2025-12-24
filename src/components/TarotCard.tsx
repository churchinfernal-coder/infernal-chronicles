import { motion } from "framer-motion";

interface TarotCardProps {
  name: string;
  suit: string;
  isReversed: boolean;
  isRevealed: boolean;
  onReveal?: () => void;
  index?: number;
}

export const TarotCard = ({ name, suit, isReversed, isRevealed, onReveal, index = 0 }: TarotCardProps) => {
  const getSuitColor = (suit: string) => {
    switch (suit) {
      case 'cups': return 'hsl(var(--primary))';
      case 'wands': return 'hsl(var(--destructive))';
      case 'swords': return 'hsl(var(--accent))';
      case 'pentacles': return 'hsl(var(--warning))';
      default: return 'hsl(var(--primary))';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateY: 0 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        rotateY: isRevealed ? 180 : 0,
        rotateZ: isReversed ? 180 : 0
      }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.2,
        rotateY: { duration: 0.6 }
      }}
      className="relative cursor-pointer group"
      onClick={onReveal}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Card Back */}
      <div 
        className="absolute inset-0 rounded-lg border-2 bg-card shadow-xl overflow-hidden"
        style={{
          backfaceVisibility: "hidden",
          borderColor: 'hsl(var(--primary))',
          boxShadow: `0 0 30px hsl(var(--primary) / 0.3)`
        }}
      >
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-6">
          <div className="w-full h-full border-2 rounded-md flex items-center justify-center"
            style={{ borderColor: 'hsl(var(--primary))' }}>
            <div className="text-4xl font-serif text-primary">✦</div>
          </div>
        </div>
      </div>

      {/* Card Front */}
      <div 
        className="relative w-48 h-72 rounded-lg border-2 bg-card p-6 flex flex-col items-center justify-between shadow-xl"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          borderColor: getSuitColor(suit),
          boxShadow: `0 0 30px ${getSuitColor(suit)}40`
        }}
      >
        <div className="text-center flex-1 flex flex-col items-center justify-center">
          <h3 className="text-xl font-serif mb-2" style={{ color: getSuitColor(suit) }}>
            {name}
          </h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            {suit === 'major' ? 'Major Arcana' : suit}
          </p>
        </div>
        
        {isReversed && (
          <div className="absolute top-2 right-2">
            <span className="text-xs text-destructive font-bold">REVERSED</span>
          </div>
        )}

        <div className="w-full h-32 flex items-center justify-center mb-4">
          <div 
            className="text-6xl opacity-20"
            style={{ color: getSuitColor(suit) }}
          >
            {suit === 'major' ? '✦' : suit === 'cups' ? '🏆' : suit === 'wands' ? '🔥' : suit === 'swords' ? '⚔️' : '💰'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
