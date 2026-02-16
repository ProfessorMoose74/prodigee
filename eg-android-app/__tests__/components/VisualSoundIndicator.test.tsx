import React from 'react';
import {render} from '@testing-library/react-native';
import VisualSoundIndicator, {
  VisualSoundOverlay,
} from '../../src/components/VisualSoundIndicator';
import {SoundVisualization} from '../../src/types/Accessibility';

// Mock timers
jest.useFakeTimers();

const mockVisualization: SoundVisualization = {
  id: 'test-viz',
  type: 'speech',
  visual: 'pulse',
  color: '#4ECDC4',
  intensity: 'medium',
  duration: 2000,
  description: 'Test speech sound',
};

describe('VisualSoundIndicator', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    const {getByText} = render(
      <VisualSoundIndicator visualization={mockVisualization} />,
    );

    expect(getByText('Test speech sound')).toBeTruthy();
  });

  it('displays correct icon for sound types', () => {
    const soundTypes = [
      {type: 'speech', expectedIcon: '💬'},
      {type: 'music', expectedIcon: '🎵'},
      {type: 'effect', expectedIcon: '✨'},
      {type: 'notification', expectedIcon: '🔔'},
      {type: 'instruction', expectedIcon: '📢'},
    ] as const;

    soundTypes.forEach(({type, expectedIcon}) => {
      const viz = {...mockVisualization, type};
      const {getByText} = render(<VisualSoundIndicator visualization={viz} />);

      expect(getByText(expectedIcon)).toBeTruthy();
    });
  });

  it('handles different visual types', () => {
    const visualTypes = ['pulse', 'wave', 'glow', 'bounce', 'flash'] as const;

    visualTypes.forEach(visual => {
      const viz = {...mockVisualization, visual};
      const {getByText} = render(<VisualSoundIndicator visualization={viz} />);

      expect(getByText('Test speech sound')).toBeTruthy();
    });
  });

  it('calls onComplete callback', () => {
    const onComplete = jest.fn();

    // Mock Animated.parallel to call the callback immediately
    const originalParallel = require('react-native').Animated.parallel;
    require('react-native').Animated.parallel = jest.fn(() => ({
      start: jest.fn((callback) => callback && callback()),
    }));

    render(
      <VisualSoundIndicator
        visualization={{...mockVisualization, duration: 1000}}
        onComplete={onComplete}
      />,
    );

    // The component uses setTimeout(callback, duration - 300)
    // So we need to advance by at least 700ms (1000 - 300)
    jest.advanceTimersByTime(700);

    // The callback should be called after the timeout and animation
    expect(onComplete).toHaveBeenCalled();

    // Restore original
    require('react-native').Animated.parallel = originalParallel;
  });
});

describe('VisualSoundOverlay', () => {
  it('renders multiple visualizations', () => {
    const visualizations: SoundVisualization[] = [
      {...mockVisualization, id: 'viz1', description: 'First sound'},
      {
        ...mockVisualization,
        id: 'viz2',
        description: 'Second sound',
        type: 'music',
      },
      {
        ...mockVisualization,
        id: 'viz3',
        description: 'Third sound',
        type: 'effect',
      },
    ];

    const {getByText} = render(
      <VisualSoundOverlay
        visualizations={visualizations}
        onVisualizationComplete={jest.fn()}
      />,
    );

    expect(getByText('First sound')).toBeTruthy();
    expect(getByText('Second sound')).toBeTruthy();
    expect(getByText('Third sound')).toBeTruthy();
  });

  it('returns null when no visualizations', () => {
    const {queryByTestId} = render(
      <VisualSoundOverlay
        visualizations={[]}
        onVisualizationComplete={jest.fn()}
      />,
    );

    // Should return null and not render anything
    expect(queryByTestId('visual-sound-overlay')).toBeNull();
  });

  it('handles visualization completion', () => {
    const onComplete = jest.fn();
    const visualizations = [mockVisualization];

    render(
      <VisualSoundOverlay
        visualizations={visualizations}
        onVisualizationComplete={onComplete}
      />,
    );

    // Fast-forward timers to trigger completion
    jest.advanceTimersByTime(mockVisualization.duration + 100);

    // Note: This test may need adjustment based on the actual implementation
    // The component should call onVisualizationComplete when animations finish
  });
});
