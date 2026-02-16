import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Animated.createAnimatedComponent
const {Animated} = require('react-native');
Animated.createAnimatedComponent = (Component: any) => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    return React.createElement(Component, {...props, ref});
  });
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock Voice Recognition
jest.mock('@react-native-voice/voice', () => ({
  onSpeechStart: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechError: jest.fn(),
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  destroy: jest.fn(() => Promise.resolve()),
  isAvailable: jest.fn(() => Promise.resolve(true)),
}));

// Mock Sound
jest.mock('react-native-sound', () => {
  const MockSound = jest.fn(() => ({
    play: jest.fn(callback => callback && callback()),
    pause: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    release: jest.fn(),
    setVolume: jest.fn(),
    getDuration: jest.fn(() => 100),
    getCurrentTime: jest.fn(callback => callback(50)),
  }));
  MockSound.setCategory = jest.fn();
  return MockSound;
});

// Mock Haptic Feedback
jest.mock('react-native-haptic-feedback', () => ({
  impact: jest.fn(),
  notification: jest.fn(),
  selection: jest.fn(),
}));

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock SVG
jest.mock('react-native-svg', () => {
  const React = require('react');
  const {View} = require('react-native');
  
  const createMockSvgComponent = (name: string) => 
    React.forwardRef((props: any, ref: any) =>
      React.createElement(View, {...props, ref, testID: props.testID || name}, props.children)
    );

  return {
    __esModule: true,
    default: createMockSvgComponent('Svg'),
    Svg: createMockSvgComponent('Svg'),
    Circle: createMockSvgComponent('Circle'),
    Ellipse: createMockSvgComponent('Ellipse'),
    G: createMockSvgComponent('G'),
    Path: createMockSvgComponent('Path'),
    Rect: createMockSvgComponent('Rect'),
    Defs: createMockSvgComponent('Defs'),
    LinearGradient: createMockSvgComponent('LinearGradient'),
    Stop: createMockSvgComponent('Stop'),
    ClipPath: createMockSvgComponent('ClipPath'),
  };
});

// Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: true,
  })),
}));

// Global test timeout
jest.setTimeout(10000);

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
