export interface AvatarCustomization {
  // Basic appearance
  skinTone: string;
  eyeColor: string;
  eyeShape: string;

  // Hair
  hairStyle: string;
  hairColor: string;

  // Facial features
  eyebrowStyle: string;
  noseShape: string;
  mouthStyle: string;

  // Clothing
  topType: string;
  topColor: string;
  topPattern: string;
  bottomType: string;
  bottomColor: string;
  bottomPattern: string;

  // Accessories
  headwear: string | null;
  headwearColor: string;
  footwear: string;
  footwearColor: string;
  glasses: string | null;
  glassesColor: string;

  // Fun extras
  background: string;
  pose: string;

  // Unlocked items (based on learning progress)
  unlockedItems: string[];

  // Metadata
  lastUpdated: number;
  version: string;
}

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string; // For display in selection
  unlockRequirement?: {
    type: 'stars' | 'activities' | 'streak' | 'accuracy';
    value: number;
    description: string;
  };
  premium?: boolean;
}

export interface AvatarCategory {
  id: string;
  name: string;
  icon: string;
  options: AvatarOption[];
  colorCustomizable: boolean;
  allowNone?: boolean; // For optional accessories
}

// Pre-defined avatar options
export const AVATAR_OPTIONS: Record<string, AvatarCategory> = {
  skinTone: {
    id: 'skinTone',
    name: 'Skin Tone',
    icon: '👤',
    colorCustomizable: false,
    options: [
      {id: 'light', name: 'Light', emoji: '🏻'},
      {id: 'medium-light', name: 'Medium Light', emoji: '🏼'},
      {id: 'medium', name: 'Medium', emoji: '🏽'},
      {id: 'medium-dark', name: 'Medium Dark', emoji: '🏾'},
      {id: 'dark', name: 'Dark', emoji: '🏿'},
    ],
  },

  hairStyle: {
    id: 'hairStyle',
    name: 'Hair Style',
    icon: '💇',
    colorCustomizable: true,
    options: [
      {id: 'short', name: 'Short', emoji: '✂️'},
      {id: 'medium', name: 'Medium', emoji: '💇‍♂️'},
      {id: 'long', name: 'Long', emoji: '💇‍♀️'},
      {id: 'curly', name: 'Curly', emoji: '🌀'},
      {id: 'braids', name: 'Braids', emoji: '🤝'},
      {id: 'pigtails', name: 'Pigtails', emoji: '🎀'},
      {
        id: 'mohawk',
        name: 'Mohawk',
        emoji: '🦅',
        unlockRequirement: {
          type: 'stars',
          value: 50,
          description: 'Earn 50 stars!',
        },
      },
      {id: 'afro', name: 'Afro', emoji: '☁️'},
      {id: 'bald', name: 'Bald', emoji: '🥚'},
    ],
  },

  eyeColor: {
    id: 'eyeColor',
    name: 'Eye Color',
    icon: '👁️',
    colorCustomizable: false,
    options: [
      {id: 'brown', name: 'Brown', emoji: '🤎'},
      {id: 'blue', name: 'Blue', emoji: '💙'},
      {id: 'green', name: 'Green', emoji: '💚'},
      {id: 'hazel', name: 'Hazel', emoji: '🧡'},
      {id: 'gray', name: 'Gray', emoji: '🩶'},
      {
        id: 'purple',
        name: 'Purple',
        emoji: '💜',
        unlockRequirement: {
          type: 'streak',
          value: 7,
          description: '7-day learning streak!',
        },
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        emoji: '🌈',
        unlockRequirement: {
          type: 'activities',
          value: 100,
          description: 'Complete 100 activities!',
        },
      },
    ],
  },

  topType: {
    id: 'topType',
    name: 'Shirt',
    icon: '👕',
    colorCustomizable: true,
    options: [
      {id: 'tshirt', name: 'T-Shirt', emoji: '👕'},
      {id: 'longsleeve', name: 'Long Sleeve', emoji: '👔'},
      {id: 'hoodie', name: 'Hoodie', emoji: '🧥'},
      {id: 'tank', name: 'Tank Top', emoji: '🎽'},
      {id: 'dress', name: 'Dress', emoji: '👗'},
      {
        id: 'superhero',
        name: 'Superhero Cape',
        emoji: '🦸',
        unlockRequirement: {
          type: 'accuracy',
          value: 90,
          description: '90% accuracy!',
        },
      },
      {
        id: 'wizard',
        name: 'Wizard Robe',
        emoji: '🧙',
        unlockRequirement: {
          type: 'stars',
          value: 100,
          description: 'Earn 100 stars!',
        },
      },
    ],
  },

  bottomType: {
    id: 'bottomType',
    name: 'Pants',
    icon: '👖',
    colorCustomizable: true,
    options: [
      {id: 'jeans', name: 'Jeans', emoji: '👖'},
      {id: 'shorts', name: 'Shorts', emoji: '🩳'},
      {id: 'skirt', name: 'Skirt', emoji: '👠'},
      {id: 'leggings', name: 'Leggings', emoji: '🧘'},
      {id: 'sweatpants', name: 'Sweatpants', emoji: '🏃'},
    ],
  },

  headwear: {
    id: 'headwear',
    name: 'Hat',
    icon: '🎩',
    colorCustomizable: true,
    allowNone: true,
    options: [
      {id: 'none', name: 'No Hat', emoji: '🚫'},
      {id: 'cap', name: 'Baseball Cap', emoji: '🧢'},
      {id: 'beanie', name: 'Beanie', emoji: '🥶'},
      {id: 'sun-hat', name: 'Sun Hat', emoji: '🌞'},
      {
        id: 'crown',
        name: 'Crown',
        emoji: '👑',
        unlockRequirement: {
          type: 'stars',
          value: 200,
          description: 'Earn 200 stars!',
        },
      },
      {
        id: 'wizard-hat',
        name: 'Wizard Hat',
        emoji: '🎩',
        unlockRequirement: {
          type: 'streak',
          value: 14,
          description: '14-day streak!',
        },
      },
      {
        id: 'party-hat',
        name: 'Party Hat',
        emoji: '🎉',
        unlockRequirement: {
          type: 'activities',
          value: 50,
          description: '50 activities!',
        },
      },
    ],
  },

  footwear: {
    id: 'footwear',
    name: 'Shoes',
    icon: '👟',
    colorCustomizable: true,
    options: [
      {id: 'sneakers', name: 'Sneakers', emoji: '👟'},
      {id: 'boots', name: 'Boots', emoji: '🥾'},
      {id: 'sandals', name: 'Sandals', emoji: '👡'},
      {id: 'dress-shoes', name: 'Dress Shoes', emoji: '👞'},
      {id: 'rain-boots', name: 'Rain Boots', emoji: '🌧️'},
      {
        id: 'rocket-boots',
        name: 'Rocket Boots',
        emoji: '🚀',
        unlockRequirement: {
          type: 'accuracy',
          value: 95,
          description: '95% accuracy!',
        },
      },
    ],
  },

  glasses: {
    id: 'glasses',
    name: 'Glasses',
    icon: '👓',
    colorCustomizable: true,
    allowNone: true,
    options: [
      {id: 'none', name: 'No Glasses', emoji: '🚫'},
      {id: 'regular', name: 'Regular', emoji: '👓'},
      {id: 'sunglasses', name: 'Sunglasses', emoji: '🕶️'},
      {id: 'reading', name: 'Reading', emoji: '📖'},
      {id: 'safety', name: 'Safety', emoji: '🥽'},
      {
        id: 'star-shaped',
        name: 'Star Shaped',
        emoji: '⭐',
        unlockRequirement: {type: 'stars', value: 75, description: '75 stars!'},
      },
    ],
  },

  background: {
    id: 'background',
    name: 'Background',
    icon: '🖼️',
    colorCustomizable: false,
    options: [
      {id: 'classroom', name: 'Classroom', emoji: '🏫'},
      {id: 'playground', name: 'Playground', emoji: '🛝'},
      {id: 'home', name: 'Home', emoji: '🏠'},
      {id: 'library', name: 'Library', emoji: '📚'},
      {
        id: 'space',
        name: 'Space',
        emoji: '🚀',
        unlockRequirement: {
          type: 'activities',
          value: 25,
          description: '25 activities!',
        },
      },
      {
        id: 'underwater',
        name: 'Underwater',
        emoji: '🌊',
        unlockRequirement: {
          type: 'streak',
          value: 5,
          description: '5-day streak!',
        },
      },
      {
        id: 'castle',
        name: 'Castle',
        emoji: '🏰',
        unlockRequirement: {
          type: 'stars',
          value: 150,
          description: '150 stars!',
        },
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        emoji: '🌈',
        unlockRequirement: {
          type: 'accuracy',
          value: 85,
          description: '85% accuracy!',
        },
      },
    ],
  },
};

export const DEFAULT_AVATAR: AvatarCustomization = {
  skinTone: 'medium',
  eyeColor: 'brown',
  eyeShape: 'normal',
  hairStyle: 'short',
  hairColor: '#8B4513',
  eyebrowStyle: 'normal',
  noseShape: 'normal',
  mouthStyle: 'smile',
  topType: 'tshirt',
  topColor: '#4A90E2',
  topPattern: 'solid',
  bottomType: 'jeans',
  bottomColor: '#1E3A8A',
  bottomPattern: 'solid',
  headwear: null,
  headwearColor: '#FF6B6B',
  footwear: 'sneakers',
  footwearColor: '#FFFFFF',
  glasses: null,
  glassesColor: '#000000',
  background: 'classroom',
  pose: 'standing',
  unlockedItems: [],
  lastUpdated: Date.now(),
  version: '1.0.0',
};

// Color palettes for customization
export const COLOR_PALETTES = {
  hair: [
    '#000000', // Black
    '#8B4513', // Brown
    '#DAA520', // Blonde
    '#B22222', // Red
    '#696969', // Gray
    '#FFFFFF', // White
    '#9400D3', // Purple (unlockable)
    '#00CED1', // Teal (unlockable)
  ],

  clothing: [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Purple
    '#FFA07A', // Orange
    '#F8F8FF', // White
    '#2F2F2F', // Black
    '#8B4513', // Brown
  ],

  accessories: [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Purple
    '#FFA07A', // Orange
    '#C0C0C0', // Silver
    '#FFD700', // Gold
  ],
};
