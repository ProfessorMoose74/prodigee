// Elemental Genius Design System
export const theme = {
  // Color Palette
  colors: {
    // Primary Educational Colors
    primary: {
      blue: '#2196F3',      // Learning & Focus
      green: '#4CAF50',     // Success & Growth
      purple: '#9C27B0',    // Creativity & Magic
      orange: '#FF9800',    // Energy & Enthusiasm
      red: '#F44336',       // Attention & Alerts
    },

    // Character Colors
    characters: {
      professor: {
        primary: '#5D4E75',   // Professor Al - Wise purple
        secondary: '#8B7EB8', // Lighter purple
        accent: '#B39DDB',    // Soft purple accent
      },
      ella: {
        primary: '#E91E63',   // Ella - Bright pink/magenta
        secondary: '#F48FB1', // Lighter pink
        accent: '#FCE4EC',    // Soft pink accent
      },
      gus: {
        primary: '#03DAC6',   // Gus - Bright teal/cyan
        secondary: '#80E5D9', // Lighter teal
        accent: '#E0F7F5',    // Soft teal accent
      },
    },

    // Semantic Colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',

    // Grayscale
    white: '#FFFFFF',
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    black: '#000000',

    // Background Gradients
    backgrounds: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      child: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      parent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      activity: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  },

  // Typography
  typography: {
    // Font Families
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      heading: '"Comic Neue", -apple-system, BlinkMacSystemFont, sans-serif',
      code: '"Fira Code", "Courier New", monospace',
    },

    // Font Sizes (responsive)
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '4rem',    // 64px
    },

    // Font Weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // Line Heights
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Spacing (8px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    tooltip: 1700,
    notification: 1800,
  },

  // Animation
  animation: {
    // Durations
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '750ms',
    },

    // Easing functions
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Educational Interface Specific
  educational: {
    // Age-specific interface scales
    ageGroups: {
      preschool: {  // 3-4 years
        buttonSize: '80px',
        fontSize: '1.5rem',
        iconSize: '48px',
        spacing: '24px',
      },
      kindergarten: { // 5-6 years
        buttonSize: '64px',
        fontSize: '1.25rem',
        iconSize: '40px',
        spacing: '20px',
      },
      elementary: { // 7+ years
        buttonSize: '56px',
        fontSize: '1.125rem',
        iconSize: '32px',
        spacing: '16px',
      },
    },

    // Progress indicators
    progress: {
      colors: {
        notStarted: '#E0E0E0',
        inProgress: '#FF9800',
        completed: '#4CAF50',
        mastered: '#2196F3',
      },
    },

    // Activity difficulty levels
    difficulty: {
      beginner: '#4CAF50',
      intermediate: '#FF9800',
      advanced: '#F44336',
      expert: '#9C27B0',
    },
  },
};