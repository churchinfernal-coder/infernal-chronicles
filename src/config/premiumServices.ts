export interface PremiumService {
  id: string;
  name: string;
  icon: string;
  description:  string;
  path: string;
  isActive:  boolean;
  requiredPosts?: number;
  requiredAccountAge?: number; // in days
  comingSoon?: boolean;
}

export const PREMIUM_SERVICES: PremiumService[] = [
  {
    id:  'ouija-chamber',
    name: 'Ouija Chamber',
    icon:  '👻',
    description:  'Communicate with spirits beyond the veil',
    path: '/ouija-chamber',
    isActive: false,
    requiredPosts: 5,
    requiredAccountAge: 7,
    comingSoon: true,
  },
  {
    id: 'tarot-reading',
    name: 'Tarot Reading',
    icon:  '🔮',
    description: 'Divine your future with mystical cards',
    path: '/tarot-reading',
    isActive: false,
    requiredPosts: 3,
    requiredAccountAge: 7,
    comingSoon: true,
  },
  {
    id: 'rune-casting',
    name: 'Rune Casting',
    icon: 'ᚱ',
    description: 'Ancient Nordic divination',
    path:  '/rune-casting',
    isActive: false,
    requiredPosts: 3,
    requiredAccountAge: 7,
    comingSoon: true,
  },
  {
    id: 'solomons-chamber',
    name: "Solomon's Chamber",
    icon:  '🔺',
    description: 'Ancient grimoires and forbidden knowledge',
    path: '/solomons-chamber',
    isActive: false,
    requiredPosts: 10,
    requiredAccountAge:  14,
    comingSoon: true,
  },
  {
    id: 'ritual-calendar',
    name: 'Ritual Calendar',
    icon: '📅',
    description: 'Track moon phases and sacred days',
    path: '/ritual-calendar',
    isActive:  false,
    requiredPosts: 3,
    requiredAccountAge: 7,
    comingSoon: true,
  },
  {
    id:  'occult-library',
    name: 'Occult Library',
    icon: '📚',
    description: 'Vast collection of esoteric texts',
    path: '/occult-library',
    isActive:  false,
    requiredPosts: 5,
    requiredAccountAge: 14,
    comingSoon: true,
  },
  {
    id:  'wicked-works',
    name: 'Wicked Works',
    icon: '⚡',
    description: 'Dark arts and powerful spells',
    path: '/wicked-works',
    isActive: false,
    requiredPosts:  15,
    requiredAccountAge: 30,
    comingSoon: true,
  },
];