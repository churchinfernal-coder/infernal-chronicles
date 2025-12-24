import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

const INFERNAL_IDENTITIES = {
  "Dark Religious Paths": [
    "Satanist",
    "Luciferian",
    "Infernalist",
    "Demonologist",
    "Left-Hand Path Practitioner",
    "Chaos Magician",
    "Occultist",
    "Dark Pagan",
    "Necromancer",
    "Theistic Satanist",
    "Daemonist",
    "Shadow Worker"
  ],
  "Alternative Spiritual Traditions": [
    "Wiccan",
    "Gnostic",
    "Kabbalist (Dark Path)",
    "Taoist Sorcerer",
    "Animist",
    "Shamanic Deathwalker",
    "Yezidi",
    "Druid (Dark Grove)",
    "Heathen (Underworld Path)",
    "Kemetic (Dark Neteru)"
  ],
  "Philosophical & Non-Theistic Identities": [
    "Atheist",
    "Agnostic",
    "Existentialist",
    "Nihilist",
    "Transhumanist (Dark Variant)",
    "Absurdist",
    "Mystic Without Allegiance"
  ],
  "Role-Based or Expressive Identities": [
    "Blood Priest/Priestess",
    "Sigil Caster",
    "Ritual Performer",
    "Coven Leader",
    "Dark Oracle",
    "Hellbound Pilgrim",
    "Soul Splitter"
  ]
};

interface InfernalIdentitySelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function InfernalIdentitySelect({ value, onChange }: InfernalIdentitySelectProps) {
  return (
    <div>
      <Label>Infernal Identity</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose your path..." />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {Object.entries(INFERNAL_IDENTITIES).map(([category, identities]) => (
            <SelectGroup key={category}>
              <SelectLabel className="text-primary font-semibold">{category}</SelectLabel>
              {identities.map((identity) => (
                <SelectItem key={identity} value={identity}>
                  {identity}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
