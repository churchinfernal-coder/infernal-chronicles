import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Flame, Skull, Moon, Eye, Book, Star, Sparkles } from "lucide-react";

interface InterestsSelectProps {
  value: string[];
  onChange: (interests: string[]) => void;
}

const PREDEFINED_INTERESTS = [
  { label: "Dark Rituals", icon: Flame, color: "text-red-400" },
  { label: "Necromancy", icon: Skull, color: "text-gray-400" },
  { label: "Moon Magic", icon: Moon, color: "text-blue-400" },
  { label: "Divination", icon: Eye, color: "text-purple-400" },
  { label: "Grimoires", icon: Book, color: "text-amber-400" },
  { label: "Astrology", icon: Star, color: "text-yellow-400" },
  { label: "Chaos Magic", icon: Sparkles, color: "text-pink-400" },
  { label: "Demonology", icon: Flame, color: "text-orange-400" },
  { label: "Blood Magic", icon: Skull, color: "text-primary" },
  { label: "Shadow Work", icon: Moon, color: "text-indigo-400" },
  { label: "Sigil Crafting", icon: Star, color: "text-violet-400" },
  { label: "Tarot Reading", icon: Eye, color: "text-cyan-400" },
];

export function InterestsSelect({ value, onChange }: InterestsSelectProps) {
  const handleToggle = (interest: string) => {
    if (value.includes(interest)) {
      onChange(value.filter(i => i !== interest));
    } else {
      onChange([...value, interest]);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-foreground font-serif">Select Your Dark Arts</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PREDEFINED_INTERESTS.map((interest) => {
          const Icon = interest.icon;
          const isSelected = value.includes(interest.label);
          
          return (
            <button
              key={interest.label}
              type="button"
              onClick={() => handleToggle(interest.label)}
              className={`horror-mood-card relative ${
                isSelected ? "horror-mood-active" : ""
              }`}
            >
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={interest.color}>
                  <Icon className={`h-8 w-8 ${
                    isSelected 
                      ? "animate-pulse drop-shadow-[0_0_15px_currentColor]" 
                      : "group-hover:scale-110 transition-transform"
                  }`} />
                </div>
                <span className={`font-serif text-sm ${
                  isSelected ? "horror-text-blood font-bold" : "text-foreground"
                }`}>
                  {interest.label}
                </span>
              </div>
              {isSelected && (
                <>
                  <div className="horror-mood-glow" />
                  <div className="absolute inset-0 rounded-lg bg-primary/5 animate-pulse pointer-events-none" />
                </>
              )}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <div className="pt-4 border-t border-primary/20">
          <Label className="text-sm text-muted-foreground font-serif mb-2 block">
            Selected Powers ({value.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {value.map((interest) => (
              <Badge 
                key={interest} 
                variant="secondary" 
                className="flex items-center gap-1 bg-primary/10 border border-primary/30 text-foreground"
              >
                {interest}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleToggle(interest)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
