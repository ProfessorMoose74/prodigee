import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Avatar customization
  currentAvatar: {
    id: null,
    name: '',
    
    // Physical features
    faceShape: 'round',
    skinTone: 'light',
    eyeColor: 'brown',
    eyeShape: 'normal',
    
    // Hair
    hairStyle: 'short',
    hairColor: 'brown',
    
    // Clothing
    topType: 'tshirt',
    topColor: 'blue',
    bottomType: 'jeans',
    bottomColor: 'blue',
    
    // Accessories
    hat: null,
    glasses: null,
    shoes: 'sneakers',
    shoeColor: 'white',
    
    // Special items (unlocked through achievements)
    specialItems: [],
    
    // Expression
    currentExpression: 'happy',
    
    // Position and animation
    position: { x: 0, y: 0, z: 0 },
    currentAnimation: 'idle',
  },
  
  // Customization options
  customizationOptions: {
    faceShapes: ['round', 'oval', 'square', 'heart'],
    skinTones: ['light', 'medium', 'tan', 'dark', 'olive'],
    eyeColors: ['brown', 'blue', 'green', 'hazel', 'gray'],
    eyeShapes: ['normal', 'wide', 'narrow', 'almond'],
    
    hairStyles: ['short', 'medium', 'long', 'curly', 'wavy', 'braids', 'ponytail', 'bun'],
    hairColors: ['black', 'brown', 'blonde', 'red', 'gray', 'purple', 'blue', 'green', 'pink'],
    
    topTypes: ['tshirt', 'longsleeve', 'hoodie', 'dress', 'tank', 'sweater'],
    topColors: ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'black', 'white'],
    
    bottomTypes: ['jeans', 'shorts', 'skirt', 'pants', 'leggings'],
    bottomColors: ['blue', 'black', 'gray', 'brown', 'white', 'pink', 'green'],
    
    hats: [null, 'baseball', 'beanie', 'cowboy', 'fedora', 'sun'],
    glasses: [null, 'regular', 'sunglasses', 'round', 'cat-eye'],
    shoes: ['sneakers', 'boots', 'sandals', 'dress', 'barefoot'],
    shoeColors: ['white', 'black', 'brown', 'red', 'blue'],
    
    expressions: ['happy', 'excited', 'curious', 'focused', 'surprised', 'proud'],
  },
  
  // Unlockable content
  unlockedItems: {
    specialHats: [],
    specialClothing: [],
    specialAccessories: [],
    backgrounds: ['classroom'],
    pets: [],
  },
  
  // Achievement-based unlocks
  unlockCriteria: {
    rainbowHair: { type: 'stars', required: 100 },
    superheroCape: { type: 'streak', required: 7 },
    crownHat: { type: 'mastery', skill: 'rhyming' },
    petDragon: { type: 'completion', weeks: 10 },
  },
  
  // Avatar progression
  level: 1,
  experiencePoints: 0,
  nextLevelXP: 100,
  
  // 3D rendering state
  is3DMode: true,
  cameraAngle: 'front',
  lighting: 'natural',
  
  // Animation states
  availableAnimations: [
    'idle', 'happy', 'excited', 'thinking', 'celebrating',
    'waving', 'clapping', 'jumping', 'reading', 'listening'
  ],
  currentAnimation: 'idle',
  animationQueue: [],
  
  // Background and environment
  currentBackground: 'classroom',
  availableBackgrounds: [
    'classroom', 'library', 'garden', 'space', 'underwater', 'forest'
  ],
  
  // Social features
  friendsAvatars: [],
  sharedAvatars: [],
  
  // Preview and editing
  isEditing: false,
  previewMode: false,
  unsavedChanges: false,
  
  // Loading and error states
  isLoading: false,
  isSaving: false,
  error: null,
};

const avatarSlice = createSlice({
  name: 'avatar',
  initialState,
  reducers: {
    // Basic avatar properties
    setAvatarName: (state, action) => {
      state.currentAvatar.name = action.payload;
      state.unsavedChanges = true;
    },

    updatePhysicalFeature: (state, action) => {
      const { feature, value } = action.payload;
      if (feature in state.currentAvatar) {
        state.currentAvatar[feature] = value;
        state.unsavedChanges = true;
      }
    },

    // Hair customization
    setHairStyle: (state, action) => {
      state.currentAvatar.hairStyle = action.payload;
      state.unsavedChanges = true;
    },

    setHairColor: (state, action) => {
      state.currentAvatar.hairColor = action.payload;
      state.unsavedChanges = true;
    },

    // Clothing customization
    setClothing: (state, action) => {
      const { type, item, color } = action.payload;
      if (type === 'top') {
        state.currentAvatar.topType = item;
        if (color) state.currentAvatar.topColor = color;
      } else if (type === 'bottom') {
        state.currentAvatar.bottomType = item;
        if (color) state.currentAvatar.bottomColor = color;
      } else if (type === 'shoes') {
        state.currentAvatar.shoes = item;
        if (color) state.currentAvatar.shoeColor = color;
      }
      state.unsavedChanges = true;
    },

    // Accessories
    setAccessory: (state, action) => {
      const { type, item } = action.payload;
      if (type === 'hat') {
        state.currentAvatar.hat = item;
      } else if (type === 'glasses') {
        state.currentAvatar.glasses = item;
      }
      state.unsavedChanges = true;
    },

    addSpecialItem: (state, action) => {
      const item = action.payload;
      if (!state.currentAvatar.specialItems.includes(item)) {
        state.currentAvatar.specialItems.push(item);
        state.unsavedChanges = true;
      }
    },

    removeSpecialItem: (state, action) => {
      const item = action.payload;
      const index = state.currentAvatar.specialItems.indexOf(item);
      if (index !== -1) {
        state.currentAvatar.specialItems.splice(index, 1);
        state.unsavedChanges = true;
      }
    },

    // Expression and animation
    setExpression: (state, action) => {
      state.currentAvatar.currentExpression = action.payload;
    },

    setAnimation: (state, action) => {
      state.currentAnimation = action.payload;
    },

    queueAnimation: (state, action) => {
      state.animationQueue.push(action.payload);
    },

    playNextAnimation: (state) => {
      if (state.animationQueue.length > 0) {
        state.currentAnimation = state.animationQueue.shift();
      } else {
        state.currentAnimation = 'idle';
      }
    },

    // Unlocking content
    unlockItem: (state, action) => {
      const { category, item } = action.payload;
      if (state.unlockedItems[category] && !state.unlockedItems[category].includes(item)) {
        state.unlockedItems[category].push(item);
      }
    },

    checkUnlocks: (state, action) => {
      const { stars, streak, masteredSkills, completedWeeks } = action.payload;
      
      Object.entries(state.unlockCriteria).forEach(([item, criteria]) => {
        let shouldUnlock = false;
        
        switch (criteria.type) {
          case 'stars':
            shouldUnlock = stars >= criteria.required;
            break;
          case 'streak':
            shouldUnlock = streak >= criteria.required;
            break;
          case 'mastery':
            shouldUnlock = masteredSkills.includes(criteria.skill);
            break;
          case 'completion':
            shouldUnlock = completedWeeks >= criteria.weeks;
            break;
        }
        
        if (shouldUnlock) {
          // Determine category and unlock
          if (item.includes('Hat')) {
            avatarSlice.caseReducers.unlockItem(state, {
              payload: { category: 'specialHats', item }
            });
          } else if (item.includes('Cape') || item.includes('Clothing')) {
            avatarSlice.caseReducers.unlockItem(state, {
              payload: { category: 'specialClothing', item }
            });
          } else if (item.includes('pet')) {
            avatarSlice.caseReducers.unlockItem(state, {
              payload: { category: 'pets', item }
            });
          }
        }
      });
    },

    // Avatar progression
    addExperience: (state, action) => {
      state.experiencePoints += action.payload;
      
      // Check for level up
      while (state.experiencePoints >= state.nextLevelXP) {
        state.experiencePoints -= state.nextLevelXP;
        state.level += 1;
        state.nextLevelXP = Math.floor(state.nextLevelXP * 1.5);
        
        // Unlock items based on level
        if (state.level % 5 === 0) {
          // Unlock special background every 5 levels
          const backgrounds = ['garden', 'space', 'underwater', 'forest'];
          const unlockIndex = Math.floor(state.level / 5) - 1;
          if (unlockIndex < backgrounds.length) {
            avatarSlice.caseReducers.unlockItem(state, {
              payload: { category: 'backgrounds', item: backgrounds[unlockIndex] }
            });
          }
        }
      }
    },

    // Environment
    setBackground: (state, action) => {
      if (state.availableBackgrounds.includes(action.payload) || 
          state.unlockedItems.backgrounds.includes(action.payload)) {
        state.currentBackground = action.payload;
        state.unsavedChanges = true;
      }
    },

    // 3D and rendering
    toggle3DMode: (state) => {
      state.is3DMode = !state.is3DMode;
    },

    setCameraAngle: (state, action) => {
      state.cameraAngle = action.payload; // 'front', 'side', 'back', 'three-quarter'
    },

    setLighting: (state, action) => {
      state.lighting = action.payload; // 'natural', 'warm', 'cool', 'dramatic'
    },

    // Position (for 3D mode)
    setPosition: (state, action) => {
      state.currentAvatar.position = action.payload;
    },

    // Editing states
    startEditing: (state) => {
      state.isEditing = true;
      state.previewMode = true;
    },

    stopEditing: (state) => {
      state.isEditing = false;
      state.previewMode = false;
    },

    togglePreview: (state) => {
      state.previewMode = !state.previewMode;
    },

    // Save and load
    saveAvatar: (state) => {
      state.isSaving = true;
      state.unsavedChanges = false;
      state.error = null;
    },

    saveAvatarSuccess: (state, action) => {
      state.isSaving = false;
      if (action.payload.id) {
        state.currentAvatar.id = action.payload.id;
      }
    },

    saveAvatarError: (state, action) => {
      state.isSaving = false;
      state.error = action.payload;
      state.unsavedChanges = true;
    },

    loadAvatar: (state, action) => {
      state.currentAvatar = {
        ...state.currentAvatar,
        ...action.payload,
      };
      state.unsavedChanges = false;
    },

    // Social features
    shareAvatar: (state) => {
      if (!state.sharedAvatars.includes(state.currentAvatar.id)) {
        state.sharedAvatars.push(state.currentAvatar.id);
      }
    },

    addFriend: (state, action) => {
      const friendAvatar = action.payload;
      if (!state.friendsAvatars.find(f => f.id === friendAvatar.id)) {
        state.friendsAvatars.push(friendAvatar);
      }
    },

    // Random generation
    randomizeAvatar: (state) => {
      const options = state.customizationOptions;
      
      state.currentAvatar = {
        ...state.currentAvatar,
        faceShape: options.faceShapes[Math.floor(Math.random() * options.faceShapes.length)],
        skinTone: options.skinTones[Math.floor(Math.random() * options.skinTones.length)],
        eyeColor: options.eyeColors[Math.floor(Math.random() * options.eyeColors.length)],
        eyeShape: options.eyeShapes[Math.floor(Math.random() * options.eyeShapes.length)],
        hairStyle: options.hairStyles[Math.floor(Math.random() * options.hairStyles.length)],
        hairColor: options.hairColors[Math.floor(Math.random() * options.hairColors.length)],
        topType: options.topTypes[Math.floor(Math.random() * options.topTypes.length)],
        topColor: options.topColors[Math.floor(Math.random() * options.topColors.length)],
        bottomType: options.bottomTypes[Math.floor(Math.random() * options.bottomTypes.length)],
        bottomColor: options.bottomColors[Math.floor(Math.random() * options.bottomColors.length)],
        shoes: options.shoes[Math.floor(Math.random() * options.shoes.length)],
        shoeColor: options.shoeColors[Math.floor(Math.random() * options.shoeColors.length)],
        currentExpression: options.expressions[Math.floor(Math.random() * options.expressions.length)],
      };
      
      state.unsavedChanges = true;
    },

    // Reset avatar
    resetToDefault: (state) => {
      state.currentAvatar = {
        ...initialState.currentAvatar,
        id: state.currentAvatar.id,
        name: state.currentAvatar.name,
      };
      state.unsavedChanges = true;
    },

    // Error handling
    setError: (state, action) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Reset slice
    reset: () => initialState,
  },
});

export const {
  setAvatarName,
  updatePhysicalFeature,
  setHairStyle,
  setHairColor,
  setClothing,
  setAccessory,
  addSpecialItem,
  removeSpecialItem,
  setExpression,
  setAnimation,
  queueAnimation,
  playNextAnimation,
  unlockItem,
  checkUnlocks,
  addExperience,
  setBackground,
  toggle3DMode,
  setCameraAngle,
  setLighting,
  setPosition,
  startEditing,
  stopEditing,
  togglePreview,
  saveAvatar,
  saveAvatarSuccess,
  saveAvatarError,
  loadAvatar,
  shareAvatar,
  addFriend,
  randomizeAvatar,
  resetToDefault,
  setError,
  clearError,
  reset,
} = avatarSlice.actions;

export default avatarSlice.reducer;