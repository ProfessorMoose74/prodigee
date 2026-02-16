import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* CSS Reset and Base Styles */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily.primary};
    font-size: ${({ theme }) => theme.typography.fontSize.base};
    font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    color: ${({ theme }) => theme.colors.gray[900]};
    background: ${({ theme }) => theme.colors.backgrounds.primary};
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  }

  h1 { font-size: ${({ theme }) => theme.typography.fontSize['5xl']}; }
  h2 { font-size: ${({ theme }) => theme.typography.fontSize['4xl']}; }
  h3 { font-size: ${({ theme }) => theme.typography.fontSize['3xl']}; }
  h4 { font-size: ${({ theme }) => theme.typography.fontSize['2xl']}; }
  h5 { font-size: ${({ theme }) => theme.typography.fontSize.xl}; }
  h6 { font-size: ${({ theme }) => theme.typography.fontSize.lg}; }

  /* Paragraphs */
  p {
    margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  }

  /* Links */
  a {
    color: ${({ theme }) => theme.colors.primary.blue};
    text-decoration: none;
    transition: color ${({ theme }) => theme.animation.duration.fast} ${({ theme }) => theme.animation.easing.easeOut};

    &:hover {
      color: ${({ theme }) => theme.colors.primary.purple};
      text-decoration: underline;
    }

    &:focus {
      outline: 2px solid ${({ theme }) => theme.colors.primary.green};
      outline-offset: 2px;
    }
  }

  /* Buttons */
  button {
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    transition: all ${({ theme }) => theme.animation.duration.fast} ${({ theme }) => theme.animation.easing.easeOut};

    &:focus {
      outline: 2px solid ${({ theme }) => theme.colors.primary.green};
      outline-offset: 2px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  /* Form Elements */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    padding: ${({ theme }) => theme.spacing[3]};
    transition: border-color ${({ theme }) => theme.animation.duration.fast} ${({ theme }) => theme.animation.easing.easeOut};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary.blue};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary.blue}20;
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.gray[500]};
    }

    &:disabled {
      background-color: ${({ theme }) => theme.colors.gray[100]};
      cursor: not-allowed;
    }
  }

  /* Lists */
  ul, ol {
    margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
    padding-left: ${({ theme }) => theme.spacing[6]};
  }

  li {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }

  /* Code */
  code, pre {
    font-family: ${({ theme }) => theme.typography.fontFamily.code};
    background-color: ${({ theme }) => theme.colors.gray[100]};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }

  code {
    padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
    font-size: 0.875em;
  }

  pre {
    padding: ${({ theme }) => theme.spacing[4]};
    overflow-x: auto;
    margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  }

  th, td {
    text-align: left;
    padding: ${({ theme }) => theme.spacing[3]};
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  }

  th {
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    background-color: ${({ theme }) => theme.colors.gray[50]};
  }

  /* Scrollbars */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray[400]};
    border-radius: ${({ theme }) => theme.borderRadius.full};

    &:hover {
      background: ${({ theme }) => theme.colors.gray[500]};
    }
  }

  /* Selection */
  ::selection {
    background: ${({ theme }) => theme.colors.primary.blue}40;
    color: ${({ theme }) => theme.colors.gray[900]};
  }

  /* Focus visible for keyboard navigation */
  .js-focus-visible :focus:not(.focus-visible) {
    outline: none;
  }

  /* Accessibility - High contrast mode */
  @media (prefers-contrast: high) {
    * {
      border-color: currentColor !important;
    }
  }

  /* Accessibility - Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Print styles */
  @media print {
    * {
      background: transparent !important;
      color: black !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    a, a:visited {
      text-decoration: underline;
    }

    a[href]:after {
      content: " (" attr(href) ")";
    }

    abbr[title]:after {
      content: " (" attr(title) ")";
    }

    img {
      max-width: 100% !important;
      page-break-inside: avoid;
    }

    p, h2, h3 {
      orphans: 3;
      widows: 3;
    }

    h2, h3 {
      page-break-after: avoid;
    }
  }

  /* Utility classes */
  .visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  .clearfix::after {
    content: "";
    display: table;
    clear: both;
  }

  /* Spinner animation for loading states */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  /* Fade animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .fade-in {
    animation: fadeIn ${({ theme }) => theme.animation.duration.normal} ${({ theme }) => theme.animation.easing.easeOut};
  }

  .fade-out {
    animation: fadeOut ${({ theme }) => theme.animation.duration.normal} ${({ theme }) => theme.animation.easing.easeOut};
  }
`;

export default GlobalStyles;