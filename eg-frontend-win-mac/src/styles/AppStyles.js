import styled from 'styled-components';

export const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.backgrounds.primary};
  
  /* Ensure consistent rendering across platforms */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Custom electron window styling */
  ${({ theme }) => `
    @media (min-width: ${theme.breakpoints.lg}) {
      border-radius: 8px;
      box-shadow: ${theme.shadows.xl};
    }
  `}
`;

export const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  
  /* Ensure content fills available space */
  min-height: 0;
  
  /* Handle different screen densities */
  @media (-webkit-min-device-pixel-ratio: 2) {
    transform: translateZ(0);
    backface-visibility: hidden;
  }
`;