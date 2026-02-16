# Elemental Genius for macOS - Installation Guide

Welcome to Elemental Genius! This guide will walk you through installing the desktop application on macOS.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: macOS 10.15 Catalina or newer
- **Chip**: Intel x64 or Apple Silicon (M1/M2) - Universal build
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 2 GB free disk space
- **Audio**: Built-in or external microphone (required)
- **Internet**: Broadband connection recommended (offline mode available)
- **Display**: 1366x768 minimum resolution, 1920x1080 recommended

### Recommended Specifications
- **Operating System**: macOS 13 Ventura or newer
- **Chip**: Apple Silicon (M1/M2) for optimal performance
- **RAM**: 8 GB or higher
- **Storage**: SSD with 4 GB free space
- **Audio**: External USB microphone or quality headset
- **Internet**: Stable broadband connection (25+ Mbps)
- **Display**: Retina display (2560x1440 or higher)

## 📥 Download Options

Visit our [releases page](https://github.com/elemental-genius/desktop-app/releases) to download the latest version.

### Choose Your Download Type:

#### 1. **DMG Disk Image (Recommended)**
- **File**: `Elemental-Genius-1.0.0-x64.dmg`
- **Size**: ~150 MB
- **Features**: 
  - Easy drag-and-drop installation
  - Includes installer window with instructions
  - Automatic code signing verification
  - Standard macOS installation method

#### 2. **ZIP Archive**
- **File**: `Elemental-Genius-1.0.0-x64.zip`
- **Size**: ~200 MB (compressed)
- **Features**:
  - Direct application bundle
  - No installer required
  - Good for advanced users
  - Smaller download size

#### 3. **PKG Installer (Enterprise)**
- **File**: `Elemental-Genius-1.0.0-x64.pkg`
- **Size**: ~150 MB
- **Features**:
  - Enterprise deployment ready
  - Command-line installation support
  - Centralized management
  - Installer package format

## 🔧 Installation Instructions

### DMG Installation (Recommended)

1. **Download** the DMG file to your Downloads folder

2. **Open** the downloaded DMG file:
   - Double-click `Elemental-Genius-1.0.0-x64.dmg`
   - Wait for the disk image to mount

3. **Installer Window Opens**:
   - You'll see the Elemental Genius application icon
   - You'll see an Applications folder shortcut
   - Background shows installation instructions

4. **Install the Application**:
   - **Drag** the Elemental Genius icon to the Applications folder
   - **Wait** for the copy process to complete (1-2 minutes)
   - The app is now installed in `/Applications/Elemental Genius.app`

5. **Eject the Disk Image**:
   - Right-click the "Elemental Genius" disk on desktop
   - Select "Eject"
   - Or drag it to the Trash

6. **Clean Up**:
   - Delete the DMG file from Downloads (optional)
   - Keep it if you might need to reinstall later

### ZIP Archive Installation

1. **Download** the ZIP file
2. **Double-click** the ZIP to extract
3. **Move** the extracted `Elemental Genius.app` to `/Applications`
4. **Delete** the ZIP file and extracted folder

### PKG Installation (Enterprise)

#### Interactive Installation
1. **Double-click** the PKG file
2. **Follow** the installer wizard
3. **Enter** administrator password when prompted
4. **Complete** installation process

#### Command Line Installation
```bash
# Silent installation
sudo installer -pkg "Elemental-Genius-1.0.0-x64.pkg" -target /

# Installation with verbose output
sudo installer -pkg "Elemental-Genius-1.0.0-x64.pkg" -target / -verbose
```

## 🚀 First Launch

### Security and Privacy

#### Gatekeeper Warning (First Launch)
macOS may show a security warning on first launch:

**If you see: "Elemental Genius cannot be opened because it is from an unidentified developer"**

1. **Open System Preferences**
2. **Go to**: Security & Privacy > General tab  
3. **Click**: "Open Anyway" next to the Elemental Genius message
4. **Confirm**: Click "Open" in the dialog

**Alternative Method:**
1. **Right-click** (Control+click) the app in Applications
2. **Select**: "Open" from context menu
3. **Click**: "Open" in the security dialog

#### Microphone Permission
On first launch, macOS will request microphone access:

1. **Permission Dialog** will appear
2. **Click "OK"** to allow microphone access
3. **This is essential** for voice activities

**If you missed the dialog:**
1. Go to System Preferences > Security & Privacy > Privacy
2. Select "Microphone" from the left sidebar
3. Check the box next to "Elemental Genius"

### Initial Setup

1. **Launch** Elemental Genius:
   - From Applications folder
   - From Launchpad
   - Search in Spotlight (⌘ + Space)

2. **Welcome Screen**:
   - Choose your language (English default)
   - Select user type: Parent or Child
   - Create your first profile

3. **Character Selection**:
   - Choose your learning companion:
     - **Professor Al** (ages 3-13+) - Scientific approach
     - **Ella** (ages 5-8) - Friendly elementary companion  
     - **Gus** (ages 3-6) - Playful young buddy
   - You can change this later in settings

4. **Avatar Creation**:
   - Customize your learning avatar
   - Start with basic options (more unlock as you learn!)
   - Click "Save" when satisfied

5. **Audio Test**:
   - Test your microphone
   - Speak clearly when prompted
   - Adjust input volume in System Preferences if needed

6. **Parent Setup** (if applicable):
   - Create parent monitoring account
   - Set up child profiles
   - Configure notification preferences

## 🔧 Troubleshooting

### Security and Permission Issues

#### "App is damaged and can't be opened"
This usually indicates a corrupted download:
1. **Delete** the app from Applications
2. **Empty** the Trash completely
3. **Re-download** from the official source
4. **Verify** file integrity and try again

#### Gatekeeper Still Blocking
If the app won't open even after following security steps:
1. **Open Terminal**
2. **Run command**:
   ```bash
   sudo xattr -rd com.apple.quarantine "/Applications/Elemental Genius.app"
   ```
3. **Enter** your admin password
4. **Try launching** the app again

#### Microphone Permission Denied
1. **System Preferences** > Security & Privacy > Privacy
2. **Select** "Microphone" from sidebar
3. **Unlock** the preferences (click lock icon)
4. **Check** the box for Elemental Genius
5. **Restart** the application

### Installation Issues

#### "Not enough disk space"
1. **Check available space**: Apple menu > About This Mac > Storage
2. **Free up space**:
   - Empty Trash completely
   - Remove large unused files
   - Use Storage Management recommendations
3. **Try installation again**

#### DMG won't mount
1. **Re-download** the DMG file (may be corrupted)
2. **Check** Downloads folder permissions
3. **Try** opening from different location
4. **Restart** your Mac and try again

#### App won't start
1. **Check** macOS version compatibility
2. **Try** launching from Terminal for error details:
   ```bash
   /Applications/Elemental\ Genius.app/Contents/MacOS/Elemental\ Genius
   ```
3. **Check** Console app for crash logs
4. **Contact support** with error details

### Performance Issues

#### App Runs Slowly
1. **Close** unnecessary applications
2. **Check** Activity Monitor for high CPU usage
3. **Restart** your Mac
4. **Update** macOS to latest version
5. **Reduce** graphics settings in app preferences

#### Voice Recognition Problems
1. **Test** microphone in System Preferences > Sound > Input
2. **Adjust** input volume levels
3. **Try** external microphone or headset
4. **Check** for background noise
5. **Ensure** stable internet connection

### Apple Silicon (M1/M2) Considerations

#### Running on Apple Silicon
- App is built as Universal Binary (runs natively)
- No Rosetta translation needed
- Optimized performance on Apple Silicon

#### If Issues Occur on Apple Silicon
1. **Verify** you downloaded the correct universal build
2. **Reset** app preferences: Delete `~/Library/Preferences/com.elementalgenius.desktop.plist`
3. **Check** for app updates regularly

## 🔄 Updates

### Automatic Updates
- Elemental Genius checks for updates automatically
- Updates download in background
- Notification appears when update is ready
- Restart app to apply updates

### Manual Updates
1. **In-app**: Help > Check for Updates
2. **Website**: Download new version and replace existing app
3. **Settings preserved** during updates

### Beta Updates (Optional)
- Join beta program for early features
- More frequent updates with latest improvements
- Help us test new functionality

## 🗑️ Uninstallation

### Standard Removal
1. **Open** Applications folder
2. **Drag** Elemental Genius to Trash
3. **Empty** Trash to complete removal

### Complete Removal (Including User Data)
1. **Remove** the application (as above)
2. **Delete** preference files:
   ```bash
   rm -rf ~/Library/Preferences/com.elementalgenius.desktop.*
   rm -rf ~/Library/Application\ Support/Elemental\ Genius/
   rm -rf ~/Library/Caches/com.elementalgenius.desktop/
   rm -rf ~/Library/Logs/Elemental\ Genius/
   ```
3. **Empty** Trash

### Using Third-Party Uninstallers
Apps like AppCleaner can remove all associated files automatically.

## 📞 Support

### Getting Help
- **Built-in Help**: Help > User Guide within the app
- **Website**: [https://elementalgenius.com/support](https://elementalgenius.com/support)
- **Email**: support@elementalgenius.com
- **GitHub Issues**: [Report bugs and request features](https://github.com/elemental-genius/desktop-app/issues)

### System Information for Support
When contacting support, please include:

**System Information:**
```bash
# Run this in Terminal to gather system info:
system_profiler SPSoftwareDataType SPHardwareDataType
```

**App Information:**
- App version (Help > About Elemental Genius)
- macOS version (Apple menu > About This Mac)
- Error messages or crash logs
- Steps to reproduce the issue

### Privacy and Data
- All learning data stored locally by default
- Parent monitoring requires explicit setup
- No personal data shared without permission
- COPPA compliant for children's privacy

## 🎉 You're Ready!

Congratulations! Elemental Genius is now installed and ready to help your child develop phonemic awareness skills through engaging, interactive learning.

**Next Steps:**
1. **Create** child profiles based on age and skill level
2. **Choose** age-appropriate learning companions
3. **Start** with Week 1 activities from Dr. Heggerty's curriculum
4. **Explore** avatar customization as activities are completed
5. **Set up** parent monitoring for progress tracking (optional)

**Pro Tips for macOS:**
- **Add to Dock**: Drag from Applications to Dock for easy access
- **Use Spotlight**: Press ⌘+Space and type "Elemental" to launch quickly
- **Enable notifications**: Allow app notifications in System Preferences
- **Use external mic**: USB or headset microphones often work better than built-in

**Happy Learning!** 🌟

---

*Elemental Genius - Bringing Dr. Michael Heggerty's proven phonemic awareness curriculum to life through cutting-edge technology.*