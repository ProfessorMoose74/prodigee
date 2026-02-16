// Avatar System Exports
export { default as AvatarCustomizer } from './AvatarCustomizer';
export { default as AvatarCreator } from './AvatarCreator';
export { default as AvatarDisplay } from './AvatarDisplay';

// Avatar utilities and constants
export const AVATAR_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl'
};

export const ACHIEVEMENT_TYPES = {
  STAR: 'star',
  CROWN: 'crown',
  FIRE: 'fire',
  GEM: 'gem'
};

// Avatar configuration utilities
export const getDefaultAvatarConfig = () => ({
  skinTone: 'light',
  hair: 'short-brown',
  accessory: 'none',
  expression: 'happy',
  background: 'default'
});

export const convertLegacyAvatar = (legacyAvatar) => {
  // Convert from the detailed avatar slice format to simplified display format
  return {
    skinTone: legacyAvatar.skinTone || 'light',
    hair: legacyAvatar.hairStyle || 'short-brown',
    accessory: legacyAvatar.glasses || legacyAvatar.hat || 'none',
    expression: legacyAvatar.currentExpression || 'happy',
    background: 'default'
  };
};

export const getUnlockRequirement = (category, itemId) => {
  const requirements = {
    hair: {
      'long-blonde': '10 activities completed',
      'curly-black': '25 activities completed',
      'pigtails': '50 activities completed',
      'mohawk': '100 activities completed'
    },
    accessories: {
      'glasses': '5 perfect scores',
      'hat': '10 perfect scores',
      'crown': '25 perfect scores',
      'superhero-mask': '50 perfect scores',
      'wizard-hat': '100 perfect scores'
    },
    expressions: {
      'cool': '20 activities completed',
      'wink': '1 week streak',
      'star-eyes': '2 week streak',
      'genius': '1 month streak'
    },
    backgrounds: {
      'forest': 'Complete forest activities',
      'ocean': 'Complete ocean activities',
      'space': 'Complete space activities',
      'magical': 'Complete magical activities'
    }
  };

  return requirements[category]?.[itemId] || null;
};