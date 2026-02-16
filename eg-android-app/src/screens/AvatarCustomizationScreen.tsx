import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../context/AuthContext';
import {Colors} from '../utils/Colors';
import {
  AvatarCustomization,
  AVATAR_OPTIONS,
  DEFAULT_AVATAR,
  COLOR_PALETTES,
  AvatarOption,
} from '../types/Avatar';
import AvatarPreview from '../components/AvatarPreview';
import ColorPicker from '../components/ColorPicker';

type AvatarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AvatarCustomizationScreen = () => {
  const navigation = useNavigation<AvatarScreenNavigationProp>();
  const {user} = useAuth();

  const [avatar, setAvatar] = useState<AvatarCustomization>(DEFAULT_AVATAR);
  const [selectedCategory, setSelectedCategory] = useState<string>('skinTone');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerFor, setColorPickerFor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const categories = Object.values(AVATAR_OPTIONS);

  const loadUserAvatar = useCallback(async () => {
    try {
      // Load user's saved avatar or use default
      // This would typically come from the API or local storage
      setAvatar(DEFAULT_AVATAR);
    } catch (error) {
      console.error('Failed to load avatar:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAvatar();
  }, [loadUserAvatar]);

  const saveAvatar = async () => {
    try {
      setIsLoading(true);

      // Save avatar to backend and local storage
      const updatedAvatar = {
        ...avatar,
        lastUpdated: Date.now(),
      };

      // Here you would save to your API
      console.log('Saving avatar:', updatedAvatar);

      Alert.alert('🎉 Avatar Saved!', 'Your awesome new look has been saved!', [
        {
          text: 'Keep Customizing',
          style: 'cancel',
        },
        {
          text: 'Go to Dashboard',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save your avatar. Please try again!');
      console.error('Avatar save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatarProperty = (
    property: keyof AvatarCustomization,
    value: any,
  ) => {
    setAvatar(prev => ({
      ...prev,
      [property]: value,
    }));
  };

  const selectOption = (category: string, optionId: string) => {
    // Check if item is unlocked
    const categoryData = AVATAR_OPTIONS[category];
    const option = categoryData.options.find(opt => opt.id === optionId);

    if (option?.unlockRequirement && !avatar.unlockedItems.includes(optionId)) {
      Alert.alert(
        '🔒 Locked Item',
        `This cool item is locked! ${option.unlockRequirement.description}`,
        [{text: 'Keep Learning!', style: 'default'}],
      );
      return;
    }

    updateAvatarProperty(category as keyof AvatarCustomization, optionId);

    // If this category supports color customization, show color picker
    if (categoryData.colorCustomizable) {
      setColorPickerFor(`${category}Color`);
      setShowColorPicker(true);
    }
  };

  const selectColor = (color: string) => {
    if (colorPickerFor) {
      updateAvatarProperty(colorPickerFor as keyof AvatarCustomization, color);
    }
    setShowColorPicker(false);
    setColorPickerFor('');
  };

  const getColorPalette = (category: string): string[] => {
    if (category.includes('hair')) {
      return COLOR_PALETTES.hair;
    }
    if (category.includes('top') || category.includes('bottom')) {
      return COLOR_PALETTES.clothing;
    }
    return COLOR_PALETTES.accessories;
  };

  const isOptionUnlocked = (option: AvatarOption): boolean => {
    if (!option.unlockRequirement) {
      return true;
    }
    return avatar.unlockedItems.includes(option.id);
  };

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
      contentContainerStyle={styles.categoryTabsContent}>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryTab,
            selectedCategory === category.id && styles.selectedCategoryTab,
          ]}
          onPress={() => setSelectedCategory(category.id)}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedCategoryText,
            ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOptions = () => {
    const category = AVATAR_OPTIONS[selectedCategory];
    if (!category) {
      return null;
    }

    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>Choose your {category.name}</Text>
        <ScrollView style={styles.optionsList}>
          <View style={styles.optionsGrid}>
            {category.options.map(option => {
              const isUnlocked = isOptionUnlocked(option);
              const isSelected =
                avatar[selectedCategory as keyof AvatarCustomization] ===
                option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    isSelected && styles.selectedOption,
                    !isUnlocked && styles.lockedOption,
                  ]}
                  onPress={() => selectOption(category.id, option.id)}
                  disabled={!isUnlocked}>
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionName,
                      isSelected && styles.selectedOptionText,
                      !isUnlocked && styles.lockedOptionText,
                    ]}>
                    {option.name}
                  </Text>

                  {!isUnlocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}

                  {option.unlockRequirement && !isUnlocked && (
                    <Text style={styles.unlockHint}>
                      {option.unlockRequirement.description}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {category.colorCustomizable && (
          <TouchableOpacity
            style={styles.colorButton}
            onPress={() => {
              setColorPickerFor(`${category.id}Color`);
              setShowColorPicker(true);
            }}>
            <Text style={styles.colorButtonText}>🎨 Choose Color</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading your avatar creator... 🎨
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Your Avatar</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveAvatar}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Your Avatar 👤</Text>
          <AvatarPreview avatar={avatar} size="large" />
          <Text style={styles.previewSubtitle}>
            Looking awesome, {user?.name || 'Learner'}!
          </Text>
        </View>

        {/* Category Tabs */}
        {renderCategoryTabs()}

        {/* Options */}
        {renderOptions()}

        {/* Fun Facts */}
        <View style={styles.funFactsSection}>
          <Text style={styles.funFactsTitle}>🌟 Fun Facts</Text>
          <Text style={styles.funFactText}>
            • Complete activities to unlock cool new items!{'\n'}• Earn stars to
            get special accessories!{'\n'}• Keep learning to unlock magical
            backgrounds!
          </Text>
        </View>
      </ScrollView>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          colors={getColorPalette(colorPickerFor)}
          onColorSelect={selectColor}
          onClose={() => setShowColorPicker(false)}
          title="Pick a Color"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.childPrimary,
    paddingTop: 50, // Account for status bar
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.surface,
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  previewSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 15,
    textAlign: 'center',
  },
  categoryTabs: {
    maxHeight: 80,
    backgroundColor: Colors.lighter,
  },
  categoryTabsContent: {
    paddingHorizontal: 10,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    minWidth: 80,
  },
  selectedCategoryTab: {
    backgroundColor: Colors.childAccent,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionsContainer: {
    padding: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionItem: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedOption: {
    borderColor: Colors.childAccent,
    backgroundColor: Colors.childAccent + '20',
  },
  lockedOption: {
    opacity: 0.6,
  },
  optionEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  optionName: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedOptionText: {
    color: Colors.childAccent,
  },
  lockedOptionText: {
    color: Colors.textSecondary,
  },
  lockOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  lockIcon: {
    fontSize: 16,
  },
  unlockHint: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  colorButton: {
    backgroundColor: Colors.childSecondary,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  colorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  funFactsSection: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 40,
  },
  funFactsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  funFactText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default AvatarCustomizationScreen;
