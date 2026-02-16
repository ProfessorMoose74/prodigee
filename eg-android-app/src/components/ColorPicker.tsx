import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {Colors} from '../utils/Colors';

interface ColorPickerProps {
  colors: string[];
  onColorSelect: (color: string) => void;
  onClose: () => void;
  title: string;
  selectedColor?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  onColorSelect,
  onClose,
  title,
  selectedColor,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const colorSize = (screenWidth - 80) / 6; // 6 colors per row with padding

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title} 🎨</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Color Grid */}
          <ScrollView style={styles.colorContainer}>
            <View style={styles.colorGrid}>
              {colors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor: color,
                      width: colorSize,
                      height: colorSize,
                    },
                    selectedColor === color && styles.selectedColorButton,
                  ]}
                  onPress={() => onColorSelect(color)}
                  activeOpacity={0.8}>
                  {selectedColor === color && (
                    <Text style={styles.selectedCheckmark}>✓</Text>
                  )}

                  {/* Color name for accessibility */}
                  <View style={styles.colorNameContainer}>
                    <Text style={styles.colorName}>{getColorName(color)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Fun Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Pick your favorite color! 🌈</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Helper function to get friendly color names for children
const getColorName = (color: string): string => {
  const colorNames: Record<string, string> = {
    '#FF6B6B': 'Red',
    '#4ECDC4': 'Teal',
    '#45B7D1': 'Blue',
    '#96CEB4': 'Green',
    '#FFEAA7': 'Yellow',
    '#DDA0DD': 'Purple',
    '#FFA07A': 'Orange',
    '#F8F8FF': 'White',
    '#2F2F2F': 'Black',
    '#8B4513': 'Brown',
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#DAA520': 'Blonde',
    '#B22222': 'Red',
    '#696969': 'Gray',
    '#9400D3': 'Purple',
    '#00CED1': 'Teal',
    '#C0C0C0': 'Silver',
    '#FFD700': 'Gold',
  };

  return colorNames[color] || 'Color';
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  colorContainer: {
    padding: 20,
    maxHeight: 400,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  colorButton: {
    borderRadius: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedColorButton: {
    borderColor: Colors.childAccent,
    borderWidth: 4,
  },
  selectedCheckmark: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  colorNameContainer: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  colorName: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ColorPicker;
