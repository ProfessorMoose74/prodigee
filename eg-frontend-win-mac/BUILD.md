# Elemental Genius Desktop - Build Guide

This guide covers building and distributing the Elemental Genius desktop application for Windows and macOS.

## Prerequisites

### Development Environment
- **Node.js**: Version 16.x or newer
- **npm**: Version 8.x or newer
- **Git**: Latest version

### Platform-Specific Requirements

#### Windows Build Requirements
- **Windows 10/11** or Windows Server 2019+
- **Visual Studio Build Tools 2019+** or Visual Studio Community
- **Windows SDK 10.0.19041.0** or newer
- **Python 3.8+** (for native module compilation)

#### macOS Build Requirements
- **macOS 10.15** (Catalina) or newer
- **Xcode 12+** with Command Line Tools
- **Apple Developer Account** (for code signing and notarization)
- **Valid Developer Certificate** for code signing

#### Code Signing Certificates

**Windows:**
```bash
# Set environment variables for Windows code signing
set CSC_LINK=path/to/certificate.p12
set CSC_KEY_PASSWORD=your_certificate_password
```

**macOS:**
```bash
# Set environment variables for macOS code signing and notarization
export APPLE_ID=your-apple-id@example.com
export APPLE_ID_PASSWORD=your-app-specific-password
export APPLE_TEAM_ID=your-team-id
export CSC_IDENTITY_AUTO_DISCOVERY=true
```

## Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd eg-frontend-win-mac
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env file with your configuration
```

## Development

### Start Development Server
```bash
npm run dev
```
This starts both the React development server and launches Electron with hot reload.

### Development Scripts
| Script | Description |
|--------|-------------|
| `npm start` | Start React development server only |
| `npm run dev` | Start React + Electron in development mode |
| `npm run electron` | Run Electron with built React app |
| `npm test` | Run test suite |

## Building for Production

### Build React App
```bash
npm run build
```
Creates optimized production build in `build/` directory.

### Platform-Specific Builds

#### Windows
```bash
# Build for Windows (creates .exe installer, portable, and MSI)
npm run build:win

# Build and publish to GitHub releases
npm run build:win-publish
```

**Output files:**
- `dist/Elemental Genius-Setup-1.0.0-x64.exe` - NSIS installer
- `dist/Elemental Genius-Portable-1.0.0-x64.exe` - Portable executable
- `dist/Elemental Genius-1.0.0-x64.msi` - MSI installer

#### macOS
```bash
# Build for macOS (creates .dmg, .zip, and .pkg)
npm run build:mac

# Build and publish to GitHub releases
npm run build:mac-publish
```

**Output files:**
- `dist/Elemental Genius-1.0.0-x64.dmg` - DMG disk image
- `dist/Elemental Genius-1.0.0-x64.zip` - Zip archive
- `dist/Elemental Genius-1.0.0-x64.pkg` - PKG installer

#### Linux (Future Support)
```bash
npm run build:linux
```

**Output files:**
- `dist/Elemental Genius-1.0.0-x64.AppImage` - AppImage
- `dist/elemental-genius_1.0.0_amd64.deb` - Debian package
- `dist/elemental-genius-1.0.0.x86_64.rpm` - RPM package

### Multi-Platform Build
```bash
npm run build:all
```
Builds for all supported platforms (requires appropriate development environment).

## Build Configuration

### Electron Builder Configuration
The build configuration is defined in `electron-builder.config.js`. Key features:

- **Cross-platform support** for Windows, macOS, and Linux
- **Code signing** for Windows and macOS
- **macOS notarization** for Gatekeeper approval
- **Auto-updater** integration
- **File associations** for .egdata files
- **Custom NSIS installer** with branding
- **DMG customization** for macOS

### Security and Permissions

#### macOS Entitlements (`build/entitlements.plist`)
- Microphone access for voice recognition
- Network access for backend communication
- File system access for user data
- Hardened Runtime compliance

#### Windows Security
- Code signing with authenticode
- UAC elevation handling
- Windows Defender exclusions (if needed)

## Distribution

### GitHub Releases
The app is configured to publish releases to GitHub automatically:

```bash
# Publish release builds
npm run release
```

### Manual Distribution
1. Build the application for target platforms
2. Test installers on clean systems
3. Upload to distribution channels
4. Update website download links

## Code Signing

### Windows Code Signing
1. Obtain a code signing certificate from a trusted CA
2. Set environment variables:
   ```bash
   set CSC_LINK=path/to/certificate.p12
   set CSC_KEY_PASSWORD=certificate_password
   ```
3. Build normally - signing happens automatically

### macOS Code Signing and Notarization
1. Set up Apple Developer account
2. Create certificates in Keychain Access
3. Set environment variables:
   ```bash
   export APPLE_ID=your-apple-id
   export APPLE_ID_PASSWORD=app-specific-password
   export APPLE_TEAM_ID=team-id
   ```
4. Build normally - signing and notarization happen automatically

## Troubleshooting

### Common Build Issues

**1. Native module compilation errors:**
```bash
npm install --build-from-source
npm rebuild electron
```

**2. Code signing failures:**
- Verify certificate validity
- Check environment variables
- Ensure proper keychain access (macOS)

**3. Notarization timeouts:**
- Check Apple ID credentials
- Verify team ID
- Wait for Apple's notarization service

**4. Build size optimization:**
- Check `files` patterns in electron-builder config
- Remove unnecessary dependencies
- Use `asar` archiving (enabled by default)

### Platform-Specific Issues

**Windows:**
- Install Visual Studio Build Tools
- Update Windows SDK
- Check Windows Defender exclusions

**macOS:**
- Update Xcode Command Line Tools
- Verify Developer Program membership
- Check certificate expiration dates

## CI/CD Integration

### GitHub Actions (Example)
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest]
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - run: npm install
    - run: npm run build
    
    - name: Build Windows
      if: matrix.os == 'windows-latest'
      run: npm run build:win-publish
      env:
        CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
        CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
    
    - name: Build macOS
      if: matrix.os == 'macos-latest'
      run: npm run build:mac-publish
      env:
        APPLE_ID: ${{ secrets.APPLE_ID }}
        APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
        APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

## Performance Optimization

### Build Size Reduction
- Use production React build
- Exclude development dependencies
- Optimize asset compression
- Enable tree shaking

### Runtime Performance
- Preload scripts for security
- Process isolation
- Hardware acceleration
- Memory usage optimization

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Update changelog
- [ ] Test on clean systems
- [ ] Verify code signing
- [ ] Check auto-updater functionality
- [ ] Validate file associations
- [ ] Test voice recognition
- [ ] Verify parent monitoring
- [ ] Check character system
- [ ] Test avatar customization
- [ ] Validate Flask backend integration

## Support

For build issues or questions:
1. Check this documentation
2. Review electron-builder documentation
3. Check platform-specific requirements
4. Create issue on GitHub repository