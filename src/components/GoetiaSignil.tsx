import { cn } from "@/lib/utils";

// Import individual seals
import seal01 from "@/assets/goetia-seals/01-bael.png";
import seal02 from "@/assets/goetia-seals/02-agares.png";
import seal03 from "@/assets/goetia-seals/03-vassago.png";
import seal04 from "@/assets/goetia-seals/04-samigina.png";
import seal05 from "@/assets/goetia-seals/05-marbas.png";
import seal06 from "@/assets/goetia-seals/06-valefor.png";
import seal07 from "@/assets/goetia-seals/07-amon.png";
import seal08 from "@/assets/goetia-seals/08-barbatos.png";
import seal09 from "@/assets/goetia-seals/09-paimon.png";
import seal10 from "@/assets/goetia-seals/10-buer.png";
import seal11 from "@/assets/goetia-seals/11-gusion.png";
import seal12 from "@/assets/goetia-seals/12-sitri.png";
import seal13 from "@/assets/goetia-seals/13-beleth.png";
import seal14 from "@/assets/goetia-seals/14-leraie.png";
import seal15 from "@/assets/goetia-seals/15-eligos.png";
import seal16 from "@/assets/goetia-seals/16-zepar.png";
import seal17 from "@/assets/goetia-seals/17-botis.png";
import seal18 from "@/assets/goetia-seals/18-bathin.png";
import seal19 from "@/assets/goetia-seals/19-sallos.png";
import seal20 from "@/assets/goetia-seals/20-purson.png";
import seal21 from "@/assets/goetia-seals/21-marax.png";
import seal22 from "@/assets/goetia-seals/22-ipos.png";
import seal23 from "@/assets/goetia-seals/23-aim.png";
import seal24 from "@/assets/goetia-seals/24-naberius.png";
import seal25 from "@/assets/goetia-seals/25-glasya-labolas.png";
import seal26 from "@/assets/goetia-seals/26-bune.png";
import seal27 from "@/assets/goetia-seals/27-ronove.png";
import seal28 from "@/assets/goetia-seals/28-berith.png";
import seal30 from "@/assets/goetia-seals/30-forneus.png";
import seal31 from "@/assets/goetia-seals/31-foras.png";
import seal32 from "@/assets/goetia-seals/32-asmoday.png";
import seal33 from "@/assets/goetia-seals/33-gaap.png";
import seal34 from "@/assets/goetia-seals/34-furfur.png";
import seal35 from "@/assets/goetia-seals/35-marchosias.png";
import seal36 from "@/assets/goetia-seals/36-stolas.png";
import seal37 from "@/assets/goetia-seals/37-phenex.png";
import seal38 from "@/assets/goetia-seals/38-halphas.png";
import seal39 from "@/assets/goetia-seals/39-malphas.png";
import seal40 from "@/assets/goetia-seals/40-raum.png";
import seal41 from "@/assets/goetia-seals/41-focalor.png";
import seal29 from "@/assets/goetia-seals/29-astaroth.png";
import seal42 from "@/assets/goetia-seals/42-vepar.png";
import seal43 from "@/assets/goetia-seals/43-sabnock.png";
import seal44 from "@/assets/goetia-seals/44-shax.png";
import seal45 from "@/assets/goetia-seals/45-vine.png";
import seal46 from "@/assets/goetia-seals/46-bifrons.png";
import seal47 from "@/assets/goetia-seals/47-uvall.png";
import seal48 from "@/assets/goetia-seals/48-haagenti.png";
import seal49 from "@/assets/goetia-seals/49-crocell.png";
import seal50 from "@/assets/goetia-seals/50-furcas.png";
import seal51 from "@/assets/goetia-seals/51-balam.png";
import seal52 from "@/assets/goetia-seals/52-alloces.png";
import seal53 from "@/assets/goetia-seals/53-caim.png";
import seal54 from "@/assets/goetia-seals/54-murmur.png";
import seal55 from "@/assets/goetia-seals/55-orobas.png";
import seal56 from "@/assets/goetia-seals/56-gremory.png";
import seal57 from "@/assets/goetia-seals/57-ose.png";
import seal58 from "@/assets/goetia-seals/58-amy.png";
import seal59 from "@/assets/goetia-seals/59-orias.png";
import seal60 from "@/assets/goetia-seals/60-vapula.png";
import seal61 from "@/assets/goetia-seals/61-zagan.png";
import seal62 from "@/assets/goetia-seals/62-volac.png";
import seal63 from "@/assets/goetia-seals/63-andras.png";
import seal64 from "@/assets/goetia-seals/64-haures.png";
import seal65 from "@/assets/goetia-seals/65-andrealphus.png";
import seal66 from "@/assets/goetia-seals/66-cimejes.png";
import seal67 from "@/assets/goetia-seals/67-amdusias.png";
import seal68 from "@/assets/goetia-seals/68-belial.png";
import seal69 from "@/assets/goetia-seals/69-decarabia.png";
import seal70 from "@/assets/goetia-seals/70-seere.png";
import seal71 from "@/assets/goetia-seals/71-dantalion.png";
import seal72 from "@/assets/goetia-seals/72-andromalius.png";

interface GoetiaSignilProps {
  demonNumber: number;
  demonName: string;
  isSelected?: boolean;
  isActive?: boolean;
  className?: string;
}

// Map demon numbers to seal images
const SEAL_MAP: Record<number, string> = {
  1: seal01,
  2: seal02,
  3: seal03,
  4: seal04,
  5: seal05,
  6: seal06,
  7: seal07,
  8: seal08,
  9: seal09,
  10: seal10,
  11: seal11,
  12: seal12,
  13: seal13,
  14: seal14,
  15: seal15,
  16: seal16,
  17: seal17,
  18: seal18,
  19: seal19,
  20: seal20,
  21: seal21,
  22: seal22,
  23: seal23,
  24: seal24,
  25: seal25,
  26: seal26,
  27: seal27,
  28: seal28,
  29: seal29,
  30: seal30,
  31: seal31,
  32: seal32,
  33: seal33,
  34: seal34,
  35: seal35,
  36: seal36,
  37: seal37,
  38: seal38,
  39: seal39,
  40: seal40,
  41: seal41,
  42: seal42,
  43: seal43,
  44: seal44,
  45: seal45,
  46: seal46,
  47: seal47,
  48: seal48,
  49: seal49,
  50: seal50,
  51: seal51,
  52: seal52,
  53: seal53,
  54: seal54,
  55: seal55,
  56: seal56,
  57: seal57,
  58: seal58,
  59: seal59,
  60: seal60,
  61: seal61,
  62: seal62,
  63: seal63,
  64: seal64,
  65: seal65,
  66: seal66,
  67: seal67,
  68: seal68,
  69: seal69,
  70: seal70,
  71: seal71,
  72: seal72,
};

export const GoetiaSignil = ({ demonNumber, demonName, isSelected, isActive, className }: GoetiaSignilProps) => {
  const sealUrl = SEAL_MAP[demonNumber];

  return (
    <div className={cn(
      "relative flex flex-col items-center gap-2 transition-all duration-300",
      className
    )}>
      <div
        className={cn(
          "w-[120px] h-[120px] p-2 rounded-full bg-black flex items-center justify-center ring-1 ring-primary/35",
          isSelected && "ring-2 ring-primary shadow-[0_0_25px_hsl(var(--primary)/0.6)]",
          isActive && "scale-105"
        )}
      >
        {sealUrl ? (
          <img
            src={sealUrl}
            alt={`${demonName} sigil`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-black" />
        )}
      </div>
      <div className={cn(
        "text-center leading-tight",
        isSelected ? "text-primary" : "text-muted-foreground"
      )}>
        <div className="font-serif text-sm">{demonName}</div>
        <div className="text-[10px] opacity-70">#{demonNumber}</div>
      </div>
    </div>
  );
};
