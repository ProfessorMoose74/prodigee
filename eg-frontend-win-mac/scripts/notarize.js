const { notarize } = require('electron-notarize');

// Apple notarization script for macOS builds
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Get environment variables
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('Skipping notarization: Apple credentials not found in environment variables');
    console.warn('Set APPLE_ID, APPLE_ID_PASSWORD, and APPLE_TEAM_ID to enable notarization');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appPath}...`);
  console.log('This may take several minutes...');

  try {
    await notarize({
      appBundleId: 'com.elementalgenius.desktop',
      appPath: appPath,
      appleId: appleId,
      appleIdPassword: appleIdPassword,
      teamId: teamId,
      tool: 'notarytool' // Use the new notarytool instead of legacy altool
    });
    
    console.log('Notarization successful!');
  } catch (error) {
    console.error('Notarization failed:', error);
    
    // Don't fail the build for notarization issues in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn('Continuing build without notarization (development mode)');
    }
  }
};