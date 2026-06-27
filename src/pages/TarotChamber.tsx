import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Sparkles, RotateCcw, BookOpen, Moon, Star, Skull, Flame, Wand2, AlertCircle
} from 'lucide-react';

// ==================== TYPES ====================
interface TarotChamberProps {
  remainingCredits?:  number;
  onCreditUsed?: () => void;
}

interface TarotCard {
  id: string;
  name: string;
  image_url: string;
  image_fallbacks: string[];
  upright_meaning: string;
  reversed_meaning: string;
  keywords: string[];
  symbolism: string;
  card_type: string;
  suit: string;
  card_number: number;
  isReversed:  boolean;
  position: number;
}

interface InfernalPath {
  id: string;
  name: string;
  image_url: string;
  description: string;
  pathType:  PathType;
  icon: any;
  color: string;
}

type PathType = 'priest' | 'chaos' | 'witch' | null;
type SpreadType = '1-card' | '3-card' | 'celtic-cross';

// ==================== CONSTANTS ====================
const SUPABASE_URL = 'https://khugyibzsujjgtddwzpa.supabase.co';
const STORAGE_BUCKET = 'Tarot cards';

const INFERNAL_PATHS: InfernalPath[] = [
  {
    id: 'path-priest',
    name: 'The Infernal Priest',
    image_url: `${SUPABASE_URL}/storage/v1/object/public/Tarot%20cards/Infernal%20Priest.png`,
    description: 'Knowledge, wisdom, and understanding of the cards.  The Priest reveals hidden meanings and guides you through traditional interpretations.',
    pathType: 'priest',
    icon:  BookOpen,
    color: 'from-purple-600 to-indigo-600'
  },
  {
    id: 'path-chaos',
    name:  'The Infernal Card',
    image_url: `${SUPABASE_URL}/storage/v1/object/public/Tarot%20cards/Infernal%20%20card.png`,
    description: 'The wild card of chaos and unpredictability. Interpretations shift and change, revealing multiple truths at once.',
    pathType: 'chaos',
    icon:  Flame,
    color: 'from-red-600 to-orange-600'
  },
  {
    id: 'path-witch',
    name: 'The Infernal Witch',
    image_url: `${SUPABASE_URL}/storage/v1/object/public/Tarot%20cards/Infernal%20Witch.png`,
    description: 'Spellcasting and practical magic. The Witch shows you how to use the cards for manifestation and ritual work.',
    pathType: 'witch',
    icon: Wand2,
    color: 'from-green-600 to-emerald-600'
  }
];

const SPREAD_CONFIGS = {
  '1-card': { count: 1, positions: ['The Card'] },
  '3-card': { count: 3, positions: ['Past', 'Present', 'Future'] },
  'celtic-cross': { 
    count: 10, 
    positions: ['Present', 'Challenge', 'Past', 'Future', 'Above', 'Below', 'Self', 'Environment', 'Hopes & Fears', 'Outcome'] 
  }
};

// ==================== ADVANCED RANDOM UTILITIES ====================

const getSecureRandomInt = (max: number): number => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] % max;
  }
  return Math.floor(Math.random() * max);
};

const fisherYatesShuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getSecureRandomBoolean = (): boolean => {
  return getSecureRandomInt(2) === 1;
};

// ==================== BULLETPROOF URL BUILDER ====================

const cleanCardName = (cardName: string): string => {
  return cardName.replace(/\s*\(\d+\)\s*$/g, '').trim();
};

const buildImageUrlVariations = (cardName: string): string[] => {
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/Tarot%20cards`;
  const urls: string[] = [];
  
  const cleaned = cleanCardName(cardName);
  
  console.log(`🔧 Original name: "${cardName}" → Cleaned: "${cleaned}"`);
  
  urls.push(`${baseUrl}/${encodeURIComponent(cleaned)}.png`);
  
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(`${cleaned}.png`);
  urls.push(data.publicUrl);
  
  urls.push(`${baseUrl}/${encodeURIComponent(cleaned. toLowerCase())}.png`);
  
  const titleCase = cleaned.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  urls.push(`${baseUrl}/${encodeURIComponent(titleCase)}.png`);
  
  urls.push(`${baseUrl}/${encodeURIComponent(cardName)}.png`);
  
  if (cleaned.toLowerCase().startsWith('the ')) {
    const withoutThe = cleaned.substring(4);
    urls.push(`${baseUrl}/${encodeURIComponent(withoutThe)}.png`);
  }
  
  const uniqueUrls = [...new Set(urls)];
  console.log(`🎯 Generated ${uniqueUrls.length} unique URL variations`);
  
  return uniqueUrls;
};

const getInterpretationByPath = (card: TarotCard, path:  PathType, position: string): string => {
  const meaning = card.isReversed ? card.reversed_meaning : card.upright_meaning;
  const cardName = card.name;
  const cardType = card.card_type === 'major_arcana' ?  'Major Arcana' : 'Minor Arcana';
  const keywords = card.keywords.length > 0 ? card.keywords :  ['mystery', 'transformation', 'power'];

  switch (path) {
    case 'priest':
      return `📚 **Traditional Interpretation**

${meaning}

**The Priest's Wisdom:**
The ${cardName} (${cardType}) appears in the ${position} position, revealing deep truths about your journey. This card carries the energy of ${keywords.slice(0, 3).join(', ')}. 

**Symbolic Meaning:**
${card.symbolism}

**In the ${position} Position:**
${card.isReversed 
  ? `Reversed, this card suggests resistance, blockages, or lessons not yet integrated. The ${position} position indicates these challenges are ${position === 'Past' ? 'unresolved from your history, shadows that still influence your present' : position === 'Present' ? 'currently manifesting in your life, demanding your immediate attention' : 'approaching in your future path, warnings to heed now'}. `
  : `Upright, this card flows with natural energy and alignment. In the ${position}, it shows ${position === 'Past' ?  'foundations you\'ve built, wisdom gained from experience' : position === 'Present' ? 'the energy you\'re working with now, opportunities at hand' : 'possibilities coming your way, destiny unfolding'}.`
}

**Practical Guidance:**
${card.isReversed 
  ? `Reflect on where you're blocking yourself.  The ${cardName} reversed asks you to confront ${keywords[0]?. toLowerCase() || 'this energy'} with complete honesty. What are you avoiding? What truth have you been unwilling to face?`
  : `Embrace the energy of ${keywords[0]?.toLowerCase() || 'this card'}. The ${cardName} encourages you to move forward with confidence. Trust the process and allow ${keywords[1]?.toLowerCase() || 'transformation'} to unfold naturally.`
}

**The Priest's Final Word:**
${position === 'Past' ? 'Your history has shaped you, but it does not define your future.' : position === 'Present' ?  'This moment is your point of power.  Act with intention.' : 'The future is unwritten. Your choices today create tomorrow\'s reality. '}`;
    
    case 'chaos':
      const chaosIndex = getSecureRandomInt(3);
      const chaosReadings = [
        `🔥 **The Chaos Whispers:**

"${meaning}"

**But wait... ** What if everything you believe about the ${cardName} is backwards?  

In the ${position}, this card dances between ${keywords[0] || 'order'} and its shadow. The chaos realm shows multiple timelines: 

• **Timeline Alpha:** ${card.isReversed ? 'Embrace the reversal as HIDDEN POWER—your "failure" is actually your greatest strength disguised' : 'The upright meaning is a COMFORTABLE LIE—dig deeper for the uncomfortable truth'}

• **Timeline Beta:** This isn't about ${keywords[0] || 'the obvious'}, it's actually about ${keywords[1] || 'the hidden'}.  The universe is playing 4D chess with you. 

• **Timeline Omega:** The ${position} position itself is THE KEY—ignore the card's face value entirely. Your REACTION to seeing this card is the real message.

**The Paradox:**
${card.symbolism}...  or does it mean the EXACT OPPOSITE?  In chaos, both are true simultaneously.  Schrödinger's tarot reading. 

**What You Should Actually Do:**
Forget everything I just said. Trust your gut over tradition. The ${cardName} has a PERSONAL message for YOU that no book, priest, or algorithm can capture.

What feeling arose the INSTANT you saw this card? That microsecond of pure reaction?  THAT is your real answer.

The ${position} position means:  ${position === 'Past' ? 'The past isn\'t behind you—it\'s happening NOW in parallel' : position === 'Present' ?  'There is no "now"—you\'re living in multiple moments' : 'The future already happened—you\'re just catching up'}

**Chaos Challenge:**
Do the OPPOSITE of what ${keywords[0]} suggests for 24 hours. Break your pattern. Chaos rewards the brave.`,

        `🌪️ **The Wild Card Shifts:**

The ${cardName} in ${position}?  **Interesting choice by the universe.**

**Official Meaning:** ${meaning}

**Chaos Translation:** What if "${meaning. toLowerCase()}" is only 30% of the truth? 

The other 70% exists in the QUANTUM SPACE between the ${position} position and YOUR specific energy signature. Consider: 

**If you're AFRAID of ${keywords[0]?.toLowerCase() || 'this energy'}:**
This card means FACE IT HEAD-ON. The universe is throwing you into the deep end.  Sink or swim time.

**If you're CONFIDENT about ${keywords[0]?.toLowerCase() || 'this energy'}:**
This card means SLOW DOWN. Your confidence is blinding you to hidden variables. Check your blind spots.

**If you're NEUTRAL:**
Flip a coin—heads you trust the card completely, tails you ignore it entirely.  Seriously.  Do it now.

**Symbolic Chaos:**
${card.symbolism}

...  but in YOUR reading, it might actually symbolize ${keywords[2] || keywords[1] || 'hidden forces'} instead. The cards lie to test you.  Are you awake enough to see through it?

${card.isReversed 
  ? `**Reversed Wildcard:** The reversal could be an ERROR in the shuffle, meaning you should read it upright. OR it's the universe SCREAMING at you.  No middle ground.`
  : `**Upright Instability:** Just because it's upright doesn't mean it's "good." In chaos, upright can mean COMPLACENCY.  Are you too comfortable?  Too safe?  The ${cardName} upright might be your warning that you're stagnating.`
}

**The ${position} Glitch:**
${position === 'Past' ? 'Your past is REWRITING ITSELF based on your present choices.  Time isn\'t linear—change now, change then.' : position === 'Present' ?  'This "present" moment is a NEXUS POINT.  Infinite timelines branch from this second.  Choose wisely.' : 'The future you\'re "predicting" is only ONE possibility. There are 847 other futures competing for manifestation. '}

**Chaos Directive:**
Don't ask "What does this mean?"—ask "What does this make me FEEL?" Feelings > logic in the chaos realm.`,

        `⚡ **Unpredictable Forces Speak:**

You drew the ${cardName}. Or did the ${cardName} draw YOU? 

**In the ${position}, This Card Says:**
${meaning}

**But Chaos Says:**
**FORGET LINEAR TIME. ** The ${position} isn't ${position === 'Past' ? 'behind' : position === 'Present' ? 'happening' : 'ahead of'} you—it's ALL happening SIMULTANEOUSLY in the quantum now. 

**Quantum Reading:**
• ${keywords[0] || 'This energy'} is COLLAPSING into reality RIGHT NOW
• ${keywords[1] || 'The shadow'} is WAITING in the wings, ready to strike
• ${keywords[2] || 'The outcome'} has ALREADY HAPPENED in another dimension—you're just catching up to it

**${cardType} Chaos Signature:**
${card.symbolism}

But here's the REAL chaos truth: That symbolism was written by someone who never met YOU.  Rewrite it. The ${cardName} means whatever YOU decide it means.

**Your Chaotic Mission:**
${card.isReversed 
  ? `This reversal is a GIFT.  Do the OPPOSITE of what this card traditionally suggests for 24 hours. Lean INTO the reversal.  Report back on what breaks open.  The ${cardName} reversed is testing your rigidity—FAIL THE TEST on purpose.`
  : `This upright card is TOO PERFECT. Suspect it.  Question it. The universe doesn't hand you clean, simple answers. Where's the catch?  Where's the shadow? Find it before it finds you.`
}

**The ${position} Paradox:**
${position === 'Past' ? 'What if your "past" is actually bleeding through from a PARALLEL TIMELINE where you made different choices?  That explains the déjà vu.' : position === 'Present' ? 'This "present" is an ILLUSION.  You\'re actually experiencing a memory from your future self.  You\'ve been here before (but also never).' : 'The "future" is a HOLOGRAM projected by your current beliefs. Change your beliefs RIGHT NOW and watch the future shimmer and shift.'}

**Final Chaos Wisdom:**
The ${cardName} is a MIRROR. If you see darkness, you're projecting darkness. If you see light, you're projecting light. Neither is "real"—both are true. 

TRUST NOTHING. QUESTION EVERYTHING. **ESPECIALLY THIS READING.**`
      ];
      return chaosReadings[chaosIndex];
    
    case 'witch':
      const suit = card.suit || 'pentacles';
      const element = suit === 'wands' ? 'Fire' : suit === 'cups' ? 'Water' : suit === 'swords' ? 'Air' : suit === 'pentacles' ? 'Earth' :  'Spirit';
      
      return `🔮 **Spellcraft Guidance**

${meaning}

**The Witch's Grimoire Entry:  ${cardName}**

**Ritual Correspondence:**
• **Element:** ${element} (${element === 'Fire' ? 'passion, willpower, transformation' : element === 'Water' ? 'emotion, intuition, flow' : element === 'Air' ? 'intellect, communication, truth' : element === 'Earth' ? 'manifestation, grounding, abundance' : 'divine connection, universal energy'})
• **Moon Phase:** ${card.isReversed ? 'Waning/Dark Moon (banishing, releasing, shadow work)' : 'Waxing/Full Moon (attracting, manifesting, amplifying)'}
• **Best Timing:** ${position === 'Past' ? 'Reflection rituals, ancestral work, past-life regression' : position === 'Present' ? 'Active spellwork, manifestation, daily practice' : 'Divination, future-casting, intention-setting'}
• **Keywords for Incantation:** ${keywords.join(', ')}
• **Color Magic:** ${card.isReversed ? 'Black, deep purple, midnight blue' : 'White, gold, silver, vibrant colors'}
• **Herbs/Crystals:** ${element === 'Fire' ? 'Dragon\'s blood, carnelian, cinnamon' : element === 'Water' ? 'Moonstone, rose, jasmine' : element === 'Air' ? 'Lavender, clear quartz, sage' : element === 'Earth' ? 'Patchouli, green aventurine, rosemary' : 'Frankincense, amethyst, star anise'}

**Manifestation Use:**
${card.symbolism}

**In the ${position} Position for Spellwork:**
${card.isReversed 
  ? `Reversed energy is PERFECT for banishing, cord-cutting, and shadow work. Use the ${cardName} to identify what needs to be RELEASED from your ${position === 'Past' ? 'history and karmic patterns' : position === 'Present' ? 'current reality and energetic field' : 'potential future and ancestral lineage'}. 

**Reversal Ritual (Dark Moon Preferred):**

1. **Preparation:** Create sacred space.  Light a black candle. Burn protective herbs (rosemary, mugwort, or dragon's blood).

2. **Invocation:** "By the power of the ${cardName} reversed, I call upon the forces of ${element} to cleanse and release.  What no longer serves me shall be cast into the void."

3. **The Working:** Write "${keywords[0]}" on black paper. Speak your pain, your blocks, your shadows into it. Feel the weight. 

4. **The Release:** Burn the paper in the black candle flame. As it burns, chant: "I release ${keywords[0]} that no longer serves me. ${cardName}, show me the hidden truth beneath the illusion.  By fire, by shadow, by will—it is done."

5. **Grounding:** Bury the ashes far from your home. Wash your hands with salt water. Close the circle.

**Post-Ritual:** Expect vivid dreams for 3 nights. Your subconscious is processing the release. `
  : `Upright energy AMPLIFIES attraction and growth spells. The ${cardName} in ${position} is a GREEN LIGHT for manifesting ${keywords[0]}. 

**Manifestation Ritual (Waxing/Full Moon Preferred):**

1. **Preparation:** Create sacred space. Light a white or gold candle. Burn herbs aligned with ${element} (see correspondence above).

2. **Invocation:** "By the power of the ${cardName} upright, I call upon the forces of ${element} to manifest my will. ${keywords[0]} flows to me now, in perfect timing, for the highest good of all."

3. **Visualization:** Close your eyes. See yourself ALREADY living with ${keywords[0]} fully present. Feel the emotions.  Taste the victory.  Hear the sounds of your new reality.  Make it VISCERAL.

4. **The Working:** Write your intention on white paper:  "I am [state of being with ${keywords[0]}]. This or something better now manifests." Anoint with oil. 

5. **The Seal:** Fold the paper toward you (attracting). Place it under the candle.  Let the candle burn completely (or for at least 3 hours if too large).

6. **The Bridge:** Carry the paper with you for 7 days. Sleep with it under your pillow.  Speak to it daily:  "By the power of ${cardName}, ${keywords[0]} flows to me."

7. **The Release:** On the 7th day, burn it, bury it, or place it on your altar. Release attachment to the outcome.  **Trust.**`
}

**Spell Ingredients for ${cardName} Work:**
• ${keywords[0]?. charAt(0).toUpperCase() + keywords[0]?.slice(1) || 'Primary energy'} (symbolic item:  ${keywords[0] === 'love' ? 'rose quartz' : keywords[0] === 'money' ? 'cinnamon stick' : keywords[0] === 'protection' ? 'black tourmaline' : 'personal token'})
• ${keywords[1]?.charAt(0).toUpperCase() + keywords[1]?.slice(1) || 'Secondary energy'} (symbolic item: ${keywords[1] === 'creativity' ? 'orange candle' : keywords[1] === 'wisdom' ? 'owl feather' : keywords[1] === 'power' ? 'red cord' : 'written intention'})
• ${card.isReversed ? 'Banishing oil (blend of black pepper, clove, and protective herbs)' : 'Manifestation oil (blend of cinnamon, vanilla, and prosperity herbs)'}
• ${card.isReversed ? 'Black salt or obsidian for protection' : 'Clear quartz or bay leaf for amplification'}

**Divination Advice for ${position}:**
${position === 'Past' ? `Your history holds KEYS.  Perform a past-life meditation with the ${cardName} on your altar. Ask: "What karmic pattern am I repeating?" Listen for the answer in dreams. ` : position === 'Present' ? `This moment is POTENT. Place the ${cardName} under your pillow tonight. Your subconscious will decode its message while you sleep.  Keep a dream journal. ` : `The future is MALLEABLE.  Scry with the ${cardName} (use a mirror, water bowl, or crystal ball). Ask: "What timeline am I creating?" Then CHANGE IT if you don't like what you see.`}

**Advanced Witch Work:**
Create a ${element} altar. Place the ${cardName} image at the center. Surround it with ${element} correspondences.  Meditate daily for 9 days. On the 9th day, perform your chosen ritual (banishing or manifesting). The accumulated energy will make it POWERFUL. 

🕯️ **The Witch's Truth:**
The ${cardName} is a TOOL, not a prophecy. YOU direct the energy. YOU command the forces. The cards don't control you—you control the cards.

**Cast with Intent.  Seal with Will. Manifest with Power.**

**So mote it be.**`;
    
    default:
      return meaning;
  }
};

// ==================== MAIN COMPONENT ====================
export default function TarotChamber({ remainingCredits = 0, onCreditUsed }: TarotChamberProps = {}) {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [spreadType, setSpreadType] = useState<SpreadType>('3-card');
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [shuffleCards, setShuffleCards] = useState<number[]>([]);
  const [imageRetryMap, setImageRetryMap] = useState<Map<string, number>>(new Map());
  const [showCreditWarning, setShowCreditWarning] = useState(false);

  useEffect(() => {
    INFERNAL_PATHS.forEach(path => {
      const img = new Image();
      img.src = path. image_url;
      img.onload = () => console.log('✅ Preloaded:', path.name);
      img.onerror = () => console.error('❌ Failed to preload:', path.image_url);
    });
  }, []);

  useEffect(() => {
    if (remainingCredits <= 3 && remainingCredits > 0) {
      setShowCreditWarning(true);
    }
  }, [remainingCredits]);

  const selectPath = (pathType: PathType) => {
    setSelectedPath(pathType);
    const pathName = INFERNAL_PATHS.find(p => p.pathType === pathType)?.name;
    toast.success(`Path of ${pathName} chosen`, {
      icon: pathType === 'priest' ? '📚' : pathType === 'chaos' ? '🔥' : '🔮'
    });
  };

  const shuffleAndDraw = async () => {
    if (! selectedPath) {
      toast.error('Choose your path first!', { icon: '⚠️' });
      return;
    }

    try {
      const { data:  { user }, error:  userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Please log in to continue', { icon: '⚠️' });
        navigate('/auth');
        return;
      }

      const { data: creditUsed, error: creditError } = await (supabase as any).rpc('use_tarot_credit', {
        p_user_id: user.id,
        p_spread_type: spreadType
      });

      if (creditError) {
        console.error('Credit usage error:', creditError);
        toast.error('Failed to use credit.  Please try again.', { icon: '❌' });
        return;
      }

      if (! creditUsed) {
        toast.error('No credits remaining!  Purchase more to continue.', { 
          icon: '💳',
          duration: 5000,
          action: {
            label: 'Get Credits',
            onClick: () => navigate('/tarot-purchase')
          }
        });
        return;
      }

      onCreditUsed?. ();

    } catch (error) {
      console.error('Pre-shuffle error:', error);
      toast.error('An error occurred.  Please try again.', { icon: '❌' });
      return;
    }

    setIsShuffling(true);
    setRevealedCards([]);
    setSelectedCardIndex(null);
    setFailedImages(new Set());
    setImageRetryMap(new Map());
    
    const shuffleArray = Array.from({ length: 30 }, (_, i) => i);
    setShuffleCards(shuffleArray);

    try {
      const cardCount = SPREAD_CONFIGS[spreadType].count;

      const { data, error, count } = await supabase
        .from('tarot_cards')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No tarot cards found in database');
      }

      console.log(`📊 Total cards in database: ${count || data.length}`);
      console.log(`🎯 Requested spread: ${spreadType} (${cardCount} cards)`);

      if (data.length < cardCount) {
        toast.error(`Only ${data.length} cards available, need ${cardCount}`, { icon: '⚠️' });
      }

      const shuffledDeck = fisherYatesShuffle(data);
      console.log(`🔀 Deck shuffled using Fisher-Yates algorithm`);

      const drawn = shuffledDeck.slice(0, Math.min(cardCount, shuffledDeck.length)).map((card:  any, index: number) => {
        const urlVariations = buildImageUrlVariations(card.name);
        console.log(`🖼️ Card "${card.name}" - Generated ${urlVariations.length} URL variations`);
        
        return {
          id: card.id,
          name: card.name,
          image_url: urlVariations[0],
          image_fallbacks: urlVariations. slice(1),
          upright_meaning: card.upright_meaning || 'No interpretation available',
          reversed_meaning: card.reversed_meaning || 'No reversed interpretation available',
          keywords: Array.isArray(card.keywords) ? card.keywords : [],
          symbolism: card.symbolism || 'Ancient wisdom encoded in imagery',
          card_type: card.card_type || 'unknown',
          suit: card.suit || 'none',
          card_number: card.card_number || 0,
          isReversed: getSecureRandomBoolean(),
          position: index
        };
      });

      console.log(`✨ Cards drawn for reading: `, drawn.map(c => `${c.name}${c.isReversed ? ' (R)' : ''}`));

      setTimeout(() => {
        setShuffleCards([]);
        setSelectedCards(drawn);
        setIsShuffling(false);
        
        const newCredits = remainingCredits - 1;
        toast.success(`Reading drawn!  ${newCredits} ${newCredits === 1 ?  'credit' : 'credits'} remaining`, { 
          icon: '🎴',
          duration: 3000 
        });
      }, 3000);

    } catch (error:  any) {
      console.error('Draw cards error:', error);
      toast.error(error.message || 'Failed to draw cards', { icon: '❌' });
      setIsShuffling(false);
      setShuffleCards([]);
    }
  };

  const revealCard = (index: number) => {
    if (revealedCards.includes(index)) {
      setSelectedCardIndex(index);
      return;
    }
    setRevealedCards(prev => [...prev, index]);
    setSelectedCardIndex(index);
  };

  const resetGame = () => {
    setSelectedPath(null);
    setSelectedCards([]);
    setRevealedCards([]);
    setSelectedCardIndex(null);
    setFailedImages(new Set());
    setShuffleCards([]);
    setImageRetryMap(new Map());
  };

  const handleImageLoad = (cardId: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    console.log(`✅ Image loaded successfully: ${cardId}`);
  };

  const handleImageError = (cardId: string, currentUrl: string) => {
    console.error(`❌ Image load failed for card ${cardId}:  ${currentUrl}`);
    
    const card = selectedCards.find(c => c.id === cardId);
    if (! card) return;

    const retryCount = imageRetryMap.get(cardId) || 0;
    
    if (retryCount < card.image_fallbacks.length) {
      const nextUrl = card.image_fallbacks[retryCount];
      console.log(`🔄 Retrying with fallback URL #${retryCount + 1}:  ${nextUrl}`);
      
      setImageRetryMap(prev => new Map(prev).set(cardId, retryCount + 1));
      
      setSelectedCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, image_url: nextUrl } : c
      ));
    } else {
      console.error(`💀 All ${card.image_fallbacks.length + 1} URL variations failed for:  ${card.name}`);
      setFailedImages(prev => new Set(prev).add(cardId));
    }
    
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  };

  const getSpreadPositionName = (index: number): string => {
    return SPREAD_CONFIGS[spreadType].positions[index] || 'Unknown';
  };

  if (! selectedPath) {
    return (
      <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-red-500/30 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920), 
                y: (typeof window !== 'undefined' ? window.innerHeight : 1080) + 100 
              }}
              animate={{ y: -100, opacity: [0, 1, 0] }}
              transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, delay: Math.random() * 5 }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity:  1, y: 0 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-gothic text-red-600 mb-6 drop-shadow-[0_0_20px_rgba(220,38,38,1)]">
              Choose Your Infernal Path
            </h1>
            <p className="text-gray-300 text-xl md:text-2xl px-4 max-w-3xl mx-auto font-medium">
              Three ancient guides await. Each offers a different way to read the cards.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl w-full px-4">
            {INFERNAL_PATHS.map((path, index) => {
              const IconComponent = path.icon;
              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity:  0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, type: 'spring', stiffness: 80 }}
                  whileHover={{ scale: 1.03, y: -15 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => selectPath(path.pathType)}
                >
                  <Card className="bg-black/90 backdrop-blur-xl border-2 border-red-600/50 hover:border-red-500 transition-all duration-500 h-full overflow-hidden group shadow-2xl hover:shadow-red-600/60">
                    <div className="h-[500px] relative bg-black overflow-hidden">
                      <img 
                        src={path. image_url} 
                        alt={path.name}
                        className="absolute inset-0 w-full h-full object-contain z-10 transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          console.error('❌ Path image failed:', path.image_url);
                          e. currentTarget.style.display = 'none';
                        }}
                        onLoad={() => console.log('✅ Path image loaded:', path.name)}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${path.color} opacity-5 group-hover:opacity-15 transition-opacity duration-500 z-0`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-5" />
                      <div className="absolute top-6 right-6 z-20">
                        <IconComponent className="h-14 w-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] animate-pulse" />
                      </div>
                    </div>
                    <CardContent className="p-8 bg-gradient-to-b from-black/80 to-black border-t-2 border-red-600/30">
                      <h3 className="text-3xl font-gothic text-red-500 mb-4 group-hover:text-red-400 transition-colors">
                        {path.name}
                      </h3>
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {path.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 overflow-hidden pb-20">
      <div className="absolute inset-0 bg-black/40" />
      
      <AnimatePresence>
        {isShuffling && shuffleCards.length > 0 && (
          <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.3 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute w-96 h-96 bg-red-600 rounded-full blur-[100px]"
            />
            
            {shuffleCards.map((cardIndex) => {
              const startX = typeof window !== 'undefined' ? window.innerWidth / 2 : 960;
              const startY = typeof window !== 'undefined' ? window.innerHeight / 2 :  540;
              const angle = (cardIndex / shuffleCards.length) * Math.PI * 2;
              const radius = 400;
              const endX = startX + Math.cos(angle) * radius;
              const endY = startY + Math.sin(angle) * radius;

              return (
                <motion. div
                  key={cardIndex}
                  className="absolute w-24 h-36 bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 border-2 border-red-600/50 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center"
                  initial={{ 
                    x: startX - 48, 
                    y: startY - 72, 
                    rotate: 0, 
                    opacity: 0,
                    scale: 0 
                  }}
                  animate={{ 
                    x: [startX - 48, endX, startX - 48],
                    y: [startY - 72, endY, startY - 72],
                    rotate: [0, 360 * (cardIndex % 2 === 0 ? 1 : -1), 720 * (cardIndex % 2 === 0 ? 1 : -1)],
                    opacity: [0, 1, 1, 0],
                    scale:  [0, 1, 1, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    times: [0, 0.3, 0.7, 1],
                    ease: "easeInOut",
                    delay: cardIndex * 0.02
                  }}
                >
                  <Flame className="h-8 w-8 text-red-600 animate-pulse" />
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity:  [0, 1, 1, 0], y: [50, 0, 0, -50] }}
              transition={{ duration: 3, times: [0, 0.2, 0.8, 1] }}
              className="absolute z-10 text-center"
            >
              <h2 className="text-6xl font-gothic text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,1)] mb-4">
                Shuffling the Deck
              </h2>
              <p className="text-gray-300 text-2xl">
                The cards are choosing you... 
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <Badge 
          className={`text-white text-sm px-4 py-2 shadow-lg ${
            remainingCredits <= 3 ? 'bg-orange-600 animate-pulse' : 'bg-purple-600'
          }`}
        >
          🎴 {remainingCredits} {remainingCredits === 1 ? 'Reading' : 'Readings'} Remaining
        </Badge>
      </div>

      {showCreditWarning && remainingCredits <= 3 && remainingCredits > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-2xl"
        >
          ⚠️ Only {remainingCredits} readings left! 
          <button 
            onClick={() => navigate('/tarot-purchase')}
            className="ml-4 underline font-bold"
          >
            Get More
          </button>
        </motion.div>
      )}

      <div className="absolute top-4 left-4 z-50">
        <Badge className="bg-red-600 text-white text-sm px-4 py-2 shadow-lg">
          Path:  {INFERNAL_PATHS. find(p => p.pathType === selectedPath)?.name}
        </Badge>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <Button 
          onClick={resetGame} 
          variant="outline" 
          size="sm" 
          className="border-red-600/50 text-red-600 hover:bg-red-600/10 hover:border-red-600 transition-all"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Change Path
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 pt-20">
        
        <motion.div
          initial={{ opacity: 0, y:  -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-gothic text-red-600 mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.9)]">
            The Tarot Chamber
          </h1>
          <p className="text-gray-400 text-lg px-4">
            Unveil the mysteries written in blood and fire
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4 mb-12 justify-center px-4"
        >
          {Object.keys(SPREAD_CONFIGS).map((type) => {
            const spreadKey = type as SpreadType;
            const isActive = spreadType === spreadKey;
            const Icon = spreadKey === '1-card' ? Star : spreadKey === '3-card' ? Sparkles : Skull;
            const label = spreadKey === '1-card' ?  'Single' : spreadKey === '3-card' ? '3-Card' : 'Celtic';

            return (
              <Button
                key={type}
                onClick={() => setSpreadType(spreadKey)}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                disabled={isShuffling}
                className={isActive 
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/50' 
                  : 'border-red-600/50 text-red-600 hover:bg-red-600/10 hover:border-red-600'
                }
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            );
          })}
        </motion.div>

        {selectedCards.length === 0 && ! isShuffling && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: 'spring', delay: 0.5 }}
          >
            <Button
              onClick={shuffleAndDraw}
              disabled={isShuffling}
              size="lg"
              className="text-lg px-8 py-6 bg-red-600 hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] transition-all duration-300"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Draw Cards
            </Button>
          </motion.div>
        )}

        {selectedCards.length > 0 && ! isShuffling && (
          <div className="w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {selectedCards.map((card, index) => {
                const isRevealed = revealedCards.includes(index);
                const isSelected = selectedCardIndex === index;
                const hasError = failedImages.has(card.id);

                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0, rotateY: 180 }}
                    animate={{ 
                      opacity: 1, 
                      scale:  isSelected ? 1.05 : 1,
                      rotateY: isRevealed ? 0 : 180
                    }}
                    transition={{ 
                      delay: index * 0.2,
                      type: 'spring',
                      stiffness:  100
                    }}
                    className="cursor-pointer"
                    onClick={() => revealCard(index)}
                  >
                    <Card 
                      className={`
                        bg-black/80 backdrop-blur border-2 overflow-hidden
                        ${isSelected ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.8)]' : 'border-red-600/50'}
                        hover:border-red-600 transition-all duration-300
                      `}
                    >
                      <div className="relative h-[500px]">
                        {! isRevealed ?  (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex flex-col items-center justify-center">
                            <Moon className="h-20 w-20 text-red-400 mb-4 animate-pulse" />
                            <Badge className="bg-red-600 text-white px-4 py-2 text-base font-bold">
                              {getSpreadPositionName(index)}
                            </Badge>
                          </div>
                        ) : (
                          <>
                            {hasError ?  (
                              <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-4">
                                <AlertCircle className="h-16 w-16 text-red-600/50 mb-4" />
                                <p className="text-red-400 text-sm text-center">Image failed to load</p>
                                <p className="text-gray-500 text-xs mt-2 text-center break-all">{cleanCardName(card.name)}</p>
                              </div>
                            ) : (
                              <img 
                                key={card.image_url}
                                src={card.image_url} 
                                alt={card.name}
                                className={`w-full h-full object-contain transition-transform duration-300 ${card.isReversed ? 'rotate-180' : ''}`}
                                onError={() => handleImageError(card.id, card.image_url)}
                                onLoad={() => handleImageLoad(card.id)}
                              />
                            )}
                            
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4">
                              <p className="text-white text-center font-bold text-base mb-1">
                                {cleanCardName(card.name)}
                              </p>
                              {card.isReversed && (
                                <Badge variant="destructive" className="w-full justify-center bg-red-600 text-sm">
                                  ⟲ Reversed
                                </Badge>
                              )}
                            </div>

                            <div className="absolute top-2 left-2 right-2">
                              <Badge className="bg-black/80 text-red-400 border border-red-600/50 text-sm w-full justify-center">
                                {getSpreadPositionName(index)}
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedCardIndex !== null && revealedCards.includes(selectedCardIndex) && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  <Card className="bg-black/90 backdrop-blur-lg border-2 border-red-600/50 shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                    <CardContent className="p-8">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <BookOpen className="h-12 w-12 text-red-600 shrink-0" />
                        <div className="space-y-6 flex-1 w-full">
                          <div>
                            <h3 className="text-4xl font-gothic text-red-600 mb-2 flex flex-wrap items-center gap-2">
                              {cleanCardName(selectedCards[selectedCardIndex].name)}
                              {selectedCards[selectedCardIndex].isReversed && (
                                <span className="text-red-400 text-xl">(Reversed)</span>
                              )}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {selectedCards[selectedCardIndex].card_type === 'major_arcana' 
                                ? `Major Arcana • Card ${selectedCards[selectedCardIndex]. card_number}` 
                                : `Minor Arcana • ${selectedCards[selectedCardIndex].suit || 'Unknown Suit'}`}
                            </p>
                          </div>

                          {selectedCards[selectedCardIndex].keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedCards[selectedCardIndex]. keywords.map((keyword, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary" 
                                  className="bg-red-950 text-red-400 border border-red-600/30 text-sm"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="space-y-3">
                            <h4 className="text-xl font-bold text-red-500 flex items-center gap-2">
                              <Flame className="h-6 w-6" />
                              Interpretation
                            </h4>
                            <div className="text-gray-300 leading-relaxed text-base whitespace-pre-line prose prose-invert max-w-none">
                              {getInterpretationByPath(
                                selectedCards[selectedCardIndex], 
                                selectedPath,
                                getSpreadPositionName(selectedCardIndex)
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion. div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button 
                onClick={shuffleAndDraw} 
                variant="outline" 
                size="lg"
                className="border-red-600/50 text-red-600 hover:bg-red-600/10 hover:border-red-600"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Draw New Cards
              </Button>
              
              <Button 
                onClick={resetGame} 
                variant="ghost" 
                size="lg"
                className="text-gray-400 hover:text-red-600 hover:bg-red-600/5"
              >
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}