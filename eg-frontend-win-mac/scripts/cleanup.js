const fs = require('fs');
const path = require('path');

// Post-build cleanup script
exports.default = async function cleanup(context) {
  console.log('Running post-build cleanup...');
  
  const { outDir, electronPlatformName } = context;
  
  try {
    // Clean up temporary files
    const tempFiles = [
      'latest.yml',
      'latest-mac.yml',
      'latest-linux.yml',
      'builder-debug.yml'
    ];
    
    for (const file of tempFiles) {
      const filePath = path.join(outDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up: ${file}`);
      }
    }
    
    // Platform-specific cleanup
    if (electronPlatformName === 'darwin') {
      console.log('Performing macOS-specific cleanup...');
      // Add any macOS-specific cleanup here
    } else if (electronPlatformName === 'win32') {
      console.log('Performing Windows-specific cleanup...');
      // Add any Windows-specific cleanup here
    }
    
    // Generate build info file
    const buildInfo = {
      version: context.packager.appInfo.version,
      platform: electronPlatformName,
      arch: context.arch,
      buildDate: new Date().toISOString(),
      electronVersion: context.packager.config.electronVersion,
      nodeVersion: process.version,
      buildEnvironment: process.env.NODE_ENV || 'development'
    };
    
    const buildInfoPath = path.join(outDir, 'build-info.json');
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    console.log('Generated build-info.json');
    
    console.log('Post-build cleanup completed successfully');
    
  } catch (error) {
    console.error('Post-build cleanup failed:', error);
    // Don't fail the build for cleanup issues
  }
};