const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Enable symlinks for monorepo support
    unstable_enableSymlinks: true,

    // Asset extensions
    assetExts: [
      // Default extensions
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'svg',
      // Audio
      'mp3',
      'wav',
      'aac',
      'm4a',
      // Fonts
      'ttf',
      'otf',
      'woff',
      'woff2',
      // Other
      'json',
    ],

    // Source extensions for hot reloading
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },

  transformer: {
    // Enable inline requires for better performance
    inlineRequires: true,

    // Performance optimizations
    minifierConfig: {
      // Keep function names for better error reporting
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },

    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },

  serializer: {
    // Bundle splitting configuration
    createModuleIdFactory: () => {
      // Use shorter module IDs in production
      return path => {
        // Generate shorter, hash-based IDs for better caching
        return require('crypto')
          .createHash('md5')
          .update(path)
          .digest('hex')
          .slice(0, 8);
      };
    },

    // Customize bundle output
    getModulesRunBeforeMainModule: () => [
      // Ensure polyfills run first
      require.resolve('react-native/Libraries/Core/InitializeCore'),
    ],
  },

  // Performance and caching
  cacheStores: [
    // Use filesystem cache for better performance
    {
      type: 'FileStore',
      root: require('path').join(require('os').tmpdir(), 'metro-cache'),
    },
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
