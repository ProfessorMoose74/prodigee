import AsyncStorage from '@react-native-async-storage/async-storage';
import {AvatarCustomization, DEFAULT_AVATAR} from '../types/Avatar';

class AvatarService {
  private readonly AVATAR_STORAGE_KEY = 'user_avatar';

  // Load avatar from local storage or server
  async loadUserAvatar(userId: number): Promise<AvatarCustomization> {
    try {
      // First try to load from local storage
      const localAvatar = await AsyncStorage.getItem(
        `${this.AVATAR_STORAGE_KEY}_${userId}`,
      );

      if (localAvatar) {
        const parsed = JSON.parse(localAvatar);
        return this.validateAvatar(parsed);
      }

      // If no local avatar, try to load from server
      try {
        // This would be an API call to get the user's avatar
        // const serverAvatar = await api.getUserAvatar(userId);
        // return this.validateAvatar(serverAvatar);
      } catch (_serverError) {
        console.warn('Failed to load avatar from server:', _serverError);
      }

      // Fall back to default avatar
      return DEFAULT_AVATAR;
    } catch (error) {
      console.error('Failed to load avatar:', error);
      return DEFAULT_AVATAR;
    }
  }

  // Save avatar to local storage and server
  async saveUserAvatar(
    userId: number,
    avatar: AvatarCustomization,
  ): Promise<void> {
    try {
      const validatedAvatar = this.validateAvatar(avatar);
      validatedAvatar.lastUpdated = Date.now();

      // Save locally first (for offline support)
      await AsyncStorage.setItem(
        `${this.AVATAR_STORAGE_KEY}_${userId}`,
        JSON.stringify(validatedAvatar),
      );

      // Then try to save to server
      try {
        // This would be an API call to save the avatar
        // await api.saveUserAvatar(userId, validatedAvatar);
        console.log('Avatar saved for user:', userId);
      } catch (_serverError) {
        console.warn(
          'Failed to save avatar to server (saved locally):',
          _serverError,
        );
      }
    } catch (error) {
      console.error('Failed to save avatar:', error);
      throw error;
    }
  }

  // Check if user has unlocked specific items based on their progress
  async updateUnlockedItems(
    userId: number,
    userProgress: {
      totalStars: number;
      completedActivities: number;
      streakDays: number;
      averageAccuracy: number;
    },
  ): Promise<string[]> {
    try {
      const currentAvatar = await this.loadUserAvatar(userId);
      const newUnlockedItems = [...currentAvatar.unlockedItems];

      // Define unlock criteria
      const unlockCriteria = [
        {itemId: 'mohawk', type: 'stars', required: 50},
        {itemId: 'purple-eyes', type: 'streak', required: 7},
        {itemId: 'rainbow-eyes', type: 'activities', required: 100},
        {itemId: 'superhero-top', type: 'accuracy', required: 90},
        {itemId: 'wizard-top', type: 'stars', required: 100},
        {itemId: 'crown', type: 'stars', required: 200},
        {itemId: 'wizard-hat', type: 'streak', required: 14},
        {itemId: 'party-hat', type: 'activities', required: 50},
        {itemId: 'rocket-boots', type: 'accuracy', required: 95},
        {itemId: 'star-glasses', type: 'stars', required: 75},
        {itemId: 'space-bg', type: 'activities', required: 25},
        {itemId: 'underwater-bg', type: 'streak', required: 5},
        {itemId: 'castle-bg', type: 'stars', required: 150},
        {itemId: 'rainbow-bg', type: 'accuracy', required: 85},
      ];

      // Check each criteria
      for (const criteria of unlockCriteria) {
        if (newUnlockedItems.includes(criteria.itemId)) {
          continue;
        }

        let hasUnlocked = false;

        switch (criteria.type) {
          case 'stars':
            hasUnlocked = userProgress.totalStars >= criteria.required;
            break;
          case 'activities':
            hasUnlocked = userProgress.completedActivities >= criteria.required;
            break;
          case 'streak':
            hasUnlocked = userProgress.streakDays >= criteria.required;
            break;
          case 'accuracy':
            hasUnlocked = userProgress.averageAccuracy >= criteria.required;
            break;
        }

        if (hasUnlocked) {
          newUnlockedItems.push(criteria.itemId);
        }
      }

      // If new items were unlocked, save the avatar
      if (newUnlockedItems.length > currentAvatar.unlockedItems.length) {
        const updatedAvatar = {
          ...currentAvatar,
          unlockedItems: newUnlockedItems,
        };
        await this.saveUserAvatar(userId, updatedAvatar);
      }

      return newUnlockedItems;
    } catch (error) {
      console.error('Failed to update unlocked items:', error);
      return [];
    }
  }

  // Validate avatar data to ensure it's safe and complete
  private validateAvatar(avatar: any): AvatarCustomization {
    // Ensure all required fields exist
    return {
      skinTone: avatar.skinTone || DEFAULT_AVATAR.skinTone,
      eyeColor: avatar.eyeColor || DEFAULT_AVATAR.eyeColor,
      eyeShape: avatar.eyeShape || DEFAULT_AVATAR.eyeShape,
      hairStyle: avatar.hairStyle || DEFAULT_AVATAR.hairStyle,
      hairColor: avatar.hairColor || DEFAULT_AVATAR.hairColor,
      eyebrowStyle: avatar.eyebrowStyle || DEFAULT_AVATAR.eyebrowStyle,
      noseShape: avatar.noseShape || DEFAULT_AVATAR.noseShape,
      mouthStyle: avatar.mouthStyle || DEFAULT_AVATAR.mouthStyle,
      topType: avatar.topType || DEFAULT_AVATAR.topType,
      topColor: avatar.topColor || DEFAULT_AVATAR.topColor,
      topPattern: avatar.topPattern || DEFAULT_AVATAR.topPattern,
      bottomType: avatar.bottomType || DEFAULT_AVATAR.bottomType,
      bottomColor: avatar.bottomColor || DEFAULT_AVATAR.bottomColor,
      bottomPattern: avatar.bottomPattern || DEFAULT_AVATAR.bottomPattern,
      headwear: avatar.headwear || null,
      headwearColor: avatar.headwearColor || DEFAULT_AVATAR.headwearColor,
      footwear: avatar.footwear || DEFAULT_AVATAR.footwear,
      footwearColor: avatar.footwearColor || DEFAULT_AVATAR.footwearColor,
      glasses: avatar.glasses || null,
      glassesColor: avatar.glassesColor || DEFAULT_AVATAR.glassesColor,
      background: avatar.background || DEFAULT_AVATAR.background,
      pose: avatar.pose || DEFAULT_AVATAR.pose,
      unlockedItems: Array.isArray(avatar.unlockedItems)
        ? avatar.unlockedItems
        : [],
      lastUpdated: avatar.lastUpdated || Date.now(),
      version: avatar.version || DEFAULT_AVATAR.version,
    };
  }

  // Get a random avatar for demos or new users
  getRandomAvatar(): AvatarCustomization {
    const skinTones = [
      'light',
      'medium-light',
      'medium',
      'medium-dark',
      'dark',
    ];
    const hairStyles = [
      'short',
      'medium',
      'long',
      'curly',
      'braids',
      'pigtails',
    ];
    const eyeColors = ['brown', 'blue', 'green', 'hazel', 'gray'];
    const topTypes = ['tshirt', 'longsleeve', 'hoodie', 'tank', 'dress'];
    const bottomTypes = ['jeans', 'shorts', 'skirt', 'leggings', 'sweatpants'];
    const backgrounds = ['classroom', 'playground', 'home', 'library'];

    return {
      ...DEFAULT_AVATAR,
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
      topType: topTypes[Math.floor(Math.random() * topTypes.length)],
      bottomType: bottomTypes[Math.floor(Math.random() * bottomTypes.length)],
      background: backgrounds[Math.floor(Math.random() * backgrounds.length)],
      lastUpdated: Date.now(),
    };
  }

  // Check if specific item is unlocked
  isItemUnlocked(avatar: AvatarCustomization, itemId: string): boolean {
    return avatar.unlockedItems.includes(itemId);
  }

  // Get items that were recently unlocked (within last week)
  getRecentlyUnlockedItems(_avatar: AvatarCustomization): string[] {
    // This would require tracking when items were unlocked
    // For now, return empty array
    return [];
  }
}

export const avatarService = new AvatarService();
