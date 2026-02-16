import React from 'react';
import {render} from '@testing-library/react-native';
import AnimatedAvatar from '../../src/components/AnimatedAvatar';
import {AvatarCustomization} from '../../src/types/Avatar';

const mockAvatar: AvatarCustomization = {
  skinTone: 'medium',
  hairStyle: 'short',
  hairColor: '#8B4513',
  eyeColor: 'brown',
  topType: 'tshirt',
  topColor: '#4ECDC4',
  bottomType: 'jeans',
  bottomColor: '#2E86AB',
  footwear: 'sneakers',
  footwearColor: '#FFFFFF',
  background: 'classroom',
  unlockedItems: [],
};

const mockAnimation = {
  type: 'waving' as const,
  duration: 1000,
  loop: false,
};

describe('AnimatedAvatar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    const {getByTestId} = render(
      <AnimatedAvatar
        avatar={mockAvatar}
        animation={mockAnimation}
        size="medium"
        testID="animated-avatar"
      />,
    );

    // Note: Due to SVG mocking, we can't test specific SVG elements
    // but we can ensure the component renders without errors
    expect(getByTestId('animated-avatar')).toBeTruthy();
  });

  it('handles different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const;

    sizes.forEach(size => {
      const {getByTestId} = render(
        <AnimatedAvatar
          avatar={mockAvatar}
          animation={mockAnimation}
          size={size}
        />,
      );

      // The component uses a fixed testID of 'animated-avatar'
      expect(getByTestId('animated-avatar')).toBeTruthy();
    });
  });

  it('calls animation callbacks', () => {
    const onAnimationStart = jest.fn();
    const onAnimationComplete = jest.fn();

    render(
      <AnimatedAvatar
        avatar={mockAvatar}
        animation={{...mockAnimation, duration: 10}} // Very short duration for test
        onAnimationStart={onAnimationStart}
        onAnimationComplete={onAnimationComplete}
      />,
    );

    // Fast-forward timers to trigger useEffect
    jest.runAllTimers();

    // Animation start should be called immediately in useEffect
    expect(onAnimationStart).toHaveBeenCalled();
  });

  it('renders different animation types', () => {
    const animationTypes = [
      'waving',
      'clapping',
      'jumping',
      'cheering',
    ] as const;

    animationTypes.forEach(type => {
      const animation = {
        type,
        duration: 1000,
        loop: false,
      };

      const {getByTestId} = render(
        <AnimatedAvatar
          avatar={mockAvatar}
          animation={animation}
        />,
      );

      expect(getByTestId('animated-avatar')).toBeTruthy();
    });
  });

  it('handles avatar customization changes', () => {
    const {rerender, getByTestId} = render(
      <AnimatedAvatar
        avatar={mockAvatar}
        animation={mockAnimation}
      />,
    );

    expect(getByTestId('animated-avatar')).toBeTruthy();

    // Test with different avatar configuration
    const newAvatar = {
      ...mockAvatar,
      skinTone: 'dark' as const,
      hairStyle: 'curly' as const,
      topColor: '#FF6B6B',
    };

    rerender(
      <AnimatedAvatar
        avatar={newAvatar}
        animation={mockAnimation}
      />,
    );

    expect(getByTestId('animated-avatar')).toBeTruthy();
  });
});
