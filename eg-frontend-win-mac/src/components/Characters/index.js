// Character System Exports
export { default as CharacterSystem } from './CharacterSystem';
export { default as ProfessorAl } from './ProfessorAl';
export { default as Ella } from './Ella';
export { default as Gus } from './Gus';
export { default as CharacterSelector } from './CharacterSelector';

// Character utilities and constants
export const CHARACTERS = {
  PROFESSOR: 'professor',
  ELLA: 'ella',
  GUS: 'gus'
};

export const CHARACTER_CONFIG = {
  professor: {
    name: 'Professor Al',
    emoji: '👨‍🏫',
    ageRange: [3, 13],
    personality: 'scientific',
    complexity: 'high',
    subjects: ['phonemes', 'advanced-blending', 'manipulation', 'curriculum-theory']
  },
  ella: {
    name: 'Ella',
    emoji: '👧',
    ageRange: [5, 8],
    personality: 'friendly',
    complexity: 'medium',
    subjects: ['rhyming', 'blending', 'segmenting', 'social-learning']
  },
  gus: {
    name: 'Gus',
    emoji: '🐨',
    ageRange: [3, 6],
    personality: 'playful',
    complexity: 'simple',
    subjects: ['basic-sounds', 'rhyming', 'play-based-learning']
  }
};

// Utility functions for character selection
export const getRecommendedCharacter = (age) => {
  if (age <= 4) return CHARACTERS.GUS;
  if (age <= 8) return CHARACTERS.ELLA;
  return CHARACTERS.PROFESSOR;
};

export const getCharacterByActivity = (activity, age = null) => {
  const complexActivities = ['phoneme-manipulation', 'advanced-blending'];
  const simpleActivities = ['rhyming', 'basic-sounds'];
  
  if (complexActivities.includes(activity)) {
    return age && age < 7 ? CHARACTERS.ELLA : CHARACTERS.PROFESSOR;
  }
  
  if (simpleActivities.includes(activity) && age && age < 6) {
    return CHARACTERS.GUS;
  }
  
  return getRecommendedCharacter(age || 7);
};

export const getCharacterProps = (character, context = {}) => {
  const baseProps = CHARACTER_CONFIG[character];
  
  return {
    ...baseProps,
    size: context.size || 'medium',
    autoSpeak: context.autoSpeak !== false,
    context: context.activity || 'general',
    ...context
  };
};