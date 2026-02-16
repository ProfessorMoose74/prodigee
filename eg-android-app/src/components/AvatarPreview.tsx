import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {AvatarCustomization} from '../types/Avatar';
import {Colors} from '../utils/Colors';

interface AvatarPreviewProps {
  avatar: AvatarCustomization;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showEdit?: boolean;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  avatar,
  size = 'medium',
  onPress,
  showEdit = false,
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallContainer;
      case 'large':
        return styles.largeContainer;
      default:
        return styles.mediumContainer;
    }
  };

  const getAvatarEmojis = () => {
    // Create a fun emoji-based avatar representation
    // This is a simplified version - in a real implementation you'd use SVG or images

    // Skin tone mapping
    const skinToneEmojis = {
      light: '🏻',
      'medium-light': '🏼',
      medium: '🏽',
      'medium-dark': '🏾',
      dark: '🏿',
    };

    // Base person emoji with skin tone
    const basePerson = `👤${
      skinToneEmojis[avatar.skinTone as keyof typeof skinToneEmojis] || ''
    }`;

    // Hair style emojis
    const hairEmojis = {
      short: '✂️',
      medium: '💇‍♂️',
      long: '💇‍♀️',
      curly: '🌀',
      braids: '🤝',
      pigtails: '🎀',
      mohawk: '🦅',
      afro: '☁️',
      bald: '🥚',
    };

    // Clothing emojis
    const topEmojis = {
      tshirt: '👕',
      longsleeve: '👔',
      hoodie: '🧥',
      tank: '🎽',
      dress: '👗',
      superhero: '🦸',
      wizard: '🧙',
    };

    const bottomEmojis = {
      jeans: '👖',
      shorts: '🩳',
      skirt: '👠',
      leggings: '🧘',
      sweatpants: '🏃',
    };

    // Accessory emojis
    const headwearEmojis = {
      cap: '🧢',
      beanie: '🥶',
      'sun-hat': '🌞',
      crown: '👑',
      'wizard-hat': '🎩',
      'party-hat': '🎉',
    };

    const footwearEmojis = {
      sneakers: '👟',
      boots: '🥾',
      sandals: '👡',
      'dress-shoes': '👞',
      'rain-boots': '🌧️',
      'rocket-boots': '🚀',
    };

    const glassesEmojis = {
      regular: '👓',
      sunglasses: '🕶️',
      reading: '📖',
      safety: '🥽',
      'star-shaped': '⭐',
    };

    // Background emojis
    const backgroundEmojis = {
      classroom: '🏫',
      playground: '🛝',
      home: '🏠',
      library: '📚',
      space: '🚀',
      underwater: '🌊',
      castle: '🏰',
      rainbow: '🌈',
    };

    return {
      base: basePerson,
      hair: hairEmojis[avatar.hairStyle as keyof typeof hairEmojis] || '✂️',
      top: topEmojis[avatar.topType as keyof typeof topEmojis] || '👕',
      bottom:
        bottomEmojis[avatar.bottomType as keyof typeof bottomEmojis] || '👖',
      headwear: avatar.headwear
        ? headwearEmojis[avatar.headwear as keyof typeof headwearEmojis]
        : null,
      footwear:
        footwearEmojis[avatar.footwear as keyof typeof footwearEmojis] || '👟',
      glasses: avatar.glasses
        ? glassesEmojis[avatar.glasses as keyof typeof glassesEmojis]
        : null,
      background:
        backgroundEmojis[avatar.background as keyof typeof backgroundEmojis] ||
        '🏫',
    };
  };

  const emojis = getAvatarEmojis();

  const renderAvatar = () => (
    <View style={[styles.avatarContainer, getSizeStyle()]}>
      {/* Background */}
      <View style={styles.backgroundLayer}>
        <Text
          style={[
            styles.backgroundEmoji,
            size === 'large'
              ? styles.largeEmoji
              : size === 'small'
              ? styles.smallEmoji
              : styles.mediumEmoji,
          ]}>
          {emojis.background}
        </Text>
      </View>

      {/* Character layers */}
      <View style={styles.characterContainer}>
        {/* Base character */}
        <Text
          style={[
            styles.baseEmoji,
            size === 'large'
              ? styles.largeEmoji
              : size === 'small'
              ? styles.smallEmoji
              : styles.mediumEmoji,
          ]}>
          {emojis.base}
        </Text>

        {/* Hair */}
        <View style={styles.hairLayer}>
          <Text
            style={[
              styles.accessoryEmoji,
              size === 'large'
                ? styles.largeMiniEmoji
                : size === 'small'
                ? styles.smallMiniEmoji
                : styles.mediumMiniEmoji,
            ]}>
            {emojis.hair}
          </Text>
        </View>

        {/* Headwear */}
        {emojis.headwear && (
          <View style={styles.headwearLayer}>
            <Text
              style={[
                styles.accessoryEmoji,
                size === 'large'
                  ? styles.largeMiniEmoji
                  : size === 'small'
                  ? styles.smallMiniEmoji
                  : styles.mediumMiniEmoji,
              ]}>
              {emojis.headwear}
            </Text>
          </View>
        )}

        {/* Glasses */}
        {emojis.glasses && (
          <View style={styles.glassesLayer}>
            <Text
              style={[
                styles.accessoryEmoji,
                size === 'large'
                  ? styles.largeMiniEmoji
                  : size === 'small'
                  ? styles.smallMiniEmoji
                  : styles.mediumMiniEmoji,
              ]}>
              {emojis.glasses}
            </Text>
          </View>
        )}
      </View>

      {/* Clothing indicators */}
      <View style={styles.clothingContainer}>
        <Text
          style={[
            styles.clothingEmoji,
            size === 'large'
              ? styles.largeMiniEmoji
              : size === 'small'
              ? styles.smallMiniEmoji
              : styles.mediumMiniEmoji,
          ]}>
          {emojis.top}
        </Text>
        <Text
          style={[
            styles.clothingEmoji,
            size === 'large'
              ? styles.largeMiniEmoji
              : size === 'small'
              ? styles.smallMiniEmoji
              : styles.mediumMiniEmoji,
          ]}>
          {emojis.bottom}
        </Text>
        <Text
          style={[
            styles.clothingEmoji,
            size === 'large'
              ? styles.largeMiniEmoji
              : size === 'small'
              ? styles.smallMiniEmoji
              : styles.mediumMiniEmoji,
          ]}>
          {emojis.footwear}
        </Text>
      </View>

      {/* Color indicators */}
      <View style={styles.colorIndicators}>
        <View style={[styles.colorDot, {backgroundColor: avatar.hairColor}]} />
        <View style={[styles.colorDot, {backgroundColor: avatar.topColor}]} />
        <View
          style={[styles.colorDot, {backgroundColor: avatar.bottomColor}]}
        />
      </View>

      {showEdit && (
        <View style={styles.editOverlay}>
          <Text style={styles.editText}>✏️ Edit</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {renderAvatar()}
      </TouchableOpacity>
    );
  }

  return renderAvatar();
};

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.childAccent,
    overflow: 'hidden',
  },
  smallContainer: {
    width: 60,
    height: 60,
  },
  mediumContainer: {
    width: 120,
    height: 120,
  },
  largeContainer: {
    width: 200,
    height: 200,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  backgroundEmoji: {
    textAlign: 'center',
  },
  characterContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseEmoji: {
    textAlign: 'center',
  },
  hairLayer: {
    position: 'absolute',
    top: -10,
    left: 0,
  },
  headwearLayer: {
    position: 'absolute',
    top: -15,
    left: 5,
  },
  glassesLayer: {
    position: 'absolute',
    top: 5,
    left: 5,
  },
  accessoryEmoji: {
    textAlign: 'center',
  },
  clothingContainer: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    gap: 2,
  },
  clothingEmoji: {
    textAlign: 'center',
  },
  colorIndicators: {
    position: 'absolute',
    top: 5,
    right: 5,
    gap: 2,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
  },
  editText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  // Size-specific emoji styles
  smallEmoji: {
    fontSize: 24,
  },
  mediumEmoji: {
    fontSize: 48,
  },
  largeEmoji: {
    fontSize: 80,
  },

  smallMiniEmoji: {
    fontSize: 8,
  },
  mediumMiniEmoji: {
    fontSize: 12,
  },
  largeMiniEmoji: {
    fontSize: 18,
  },
});

export default AvatarPreview;
