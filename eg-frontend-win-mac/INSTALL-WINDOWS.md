# Elemental Genius for Windows - Installation Guide

Welcome to Elemental Genius! This guide will walk you through installing the desktop application on Windows.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10 (64-bit) or newer
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 2 GB free disk space
- **Audio**: Microphone for voice activities (required)
- **Internet**: Broadband connection recommended (offline mode available)
- **Display**: 1366x768 minimum resolution, 1920x1080 recommended

### Recommended Specifications
- **Operating System**: Windows 11
- **RAM**: 8 GB or higher
- **Storage**: SSD with 4 GB free space
- **Audio**: High-quality USB microphone or headset
- **Internet**: Stable broadband connection (25+ Mbps)
- **Display**: 1920x1080 or higher resolution

## 📥 Download Options

Visit our [releases page](https://github.com/elemental-genius/desktop-app/releases) to download the latest version.

### Choose Your Installer Type:

#### 1. **Setup Installer (Recommended)**
- **File**: `Elemental-Genius-Setup-1.0.0-x64.exe`
- **Size**: ~150 MB
- **Features**: 
  - Full installation with automatic updates
  - Desktop and Start Menu shortcuts
  - File associations for `.egdata` files
  - Uninstaller included
  - Windows integration

#### 2. **Portable Version**
- **File**: `Elemental-Genius-Portable-1.0.0-x64.exe`
- **Size**: ~200 MB
- **Features**:
  - No installation required
  - Run from USB drive or any location
  - No registry modifications
  - Perfect for testing or restricted environments

#### 3. **MSI Installer (Enterprise)**
- **File**: `Elemental-Genius-1.0.0-x64.msi`
- **Size**: ~150 MB
- **Features**:
  - Enterprise deployment ready
  - Group Policy support
  - Silent installation options
  - Centralized management

## 🔧 Installation Instructions

### Setup Installer Installation

1. **Download** the setup installer file
2. **Right-click** the downloaded file and select "Run as administrator" (if prompted)
3. **Windows Security** may show a warning:
   - Click "More info"
   - Click "Run anyway"
   - *(This happens because we're a new publisher - the app is completely safe)*

4. **Welcome Screen**:
   - Click "Next" to begin installation

5. **License Agreement**:
   - Read the license agreement
   - Check "I accept the agreement"
   - Click "Next"

6. **Choose Installation Location**:
   - Default location: `C:\Program Files\Elemental Genius`
   - Click "Browse..." to change location (not recommended)
   - Click "Next"

7. **Select Components**:
   - ☑️ **Core Application** (required)
   - ☑️ **Desktop Shortcut** (recommended)
   - ☑️ **Quick Launch Shortcut** (optional)
   - ☑️ **Voice Recognition Data** (recommended for better accuracy)
   - ☑️ **Curriculum Resources** (recommended for offline use)
   - Click "Next"

8. **Ready to Install**:
   - Review your selections
   - Click "Install" to begin

9. **Installation Progress**:
   - Wait for installation to complete (~2-3 minutes)
   - Files are being extracted and configured

10. **Completing Installation**:
    - ☑️ **Launch Elemental Genius now** (recommended)
    - Click "Finish"

### Portable Version Setup

1. **Download** the portable executable
2. **Create a folder** for Elemental Genius (e.g., `C:\PortableApps\ElementalGenius`)
3. **Move** the downloaded file to this folder
4. **Double-click** the executable to run
5. **Create shortcuts** manually if desired:
   - Right-click the executable
   - Select "Create shortcut"
   - Move shortcut to Desktop or Start Menu

### MSI Installation (Enterprise)

#### Interactive Installation
```cmd
msiexec /i "Elemental-Genius-1.0.0-x64.msi"
```

#### Silent Installation
```cmd
msiexec /i "Elemental-Genius-1.0.0-x64.msi" /quiet /norestart
```

#### Installation with Logging
```cmd
msiexec /i "Elemental-Genius-1.0.0-x64.msi" /l*v install.log
```

## 🚀 First Launch

### Initial Setup

1. **Launch** Elemental Genius from:
   - Desktop shortcut
   - Start Menu > Elemental Genius
   - Search "Elemental Genius" in Start Menu

2. **Microphone Permission**:
   - Windows will request microphone access
   - Click "Allow" for voice activities to work
   - This is essential for phonemic awareness activities

3. **Welcome Screen**:
   - Choose your language (English default)
   - Select user type: Parent or Child
   - Create your first profile

4. **Character Selection**:
   - Choose your learning companion:
     - **Professor Al** (ages 3-13+) - Scientific approach
     - **Ella** (ages 5-8) - Friendly elementary companion  
     - **Gus** (ages 3-6) - Playful young buddy
   - You can change this later in settings

5. **Avatar Creation**:
   - Customize your learning avatar
   - Start with basic options (more unlock as you learn!)
   - Click "Save" when satisfied

6. **Audio Test**:
   - Test your microphone
   - Speak clearly when prompted
   - Adjust volume if needed

7. **Parent Setup** (if applicable):
   - Create parent monitoring account
   - Set up child profiles
   - Configure notification preferences

## 🔧 Troubleshooting

### Common Installation Issues

#### "Windows protected your PC" Warning
This is normal for new applications. To proceed:
1. Click "More info"
2. Click "Run anyway"
3. The app is completely safe - this warning appears for new publishers

#### Installation Fails with Error
1. **Run as Administrator**:
   - Right-click installer
   - Select "Run as administrator"

2. **Disable Antivirus Temporarily**:
   - Some antivirus software may interfere
   - Add exception for Elemental Genius

3. **Check Disk Space**:
   - Ensure at least 2GB free space
   - Clear temporary files if needed

4. **Update Windows**:
   - Install latest Windows updates
   - Restart computer and try again

#### Microphone Not Working
1. **Check Privacy Settings**:
   - Go to Settings > Privacy > Microphone
   - Enable "Allow apps to access your microphone"
   - Enable for Elemental Genius specifically

2. **Test Microphone**:
   - Go to Settings > System > Sound
   - Test microphone under "Input"
   - Adjust levels as needed

3. **Check Hardware**:
   - Ensure microphone is connected
   - Try different USB port
   - Test with other applications

### Performance Issues

#### App Runs Slowly
1. **Close Other Programs**:
   - Free up system memory
   - Close unnecessary browser tabs

2. **Update Graphics Drivers**:
   - Visit manufacturer website
   - Install latest drivers

3. **Adjust Settings**:
   - Lower graphics quality in app settings
   - Disable animations if needed

#### Voice Recognition Problems
1. **Check Microphone Quality**:
   - Use a headset microphone for best results
   - Reduce background noise

2. **Internet Connection**:
   - Ensure stable connection for cloud processing
   - App can work offline but with reduced accuracy

3. **Update Audio Drivers**:
   - Update sound card drivers
   - Restart application

## 🔄 Updates

### Automatic Updates
- Elemental Genius checks for updates automatically
- Updates download and install in background
- Restart when prompted to apply updates

### Manual Updates
- Go to Help > Check for Updates
- Download new installer from website
- Install over existing version (settings preserved)

## 🗑️ Uninstallation

### Using Windows Settings
1. Go to Settings > Apps
2. Search "Elemental Genius"
3. Click app and select "Uninstall"
4. Follow prompts to remove

### Using Control Panel
1. Open Control Panel > Programs and Features
2. Find "Elemental Genius"
3. Click "Uninstall"
4. Follow uninstaller prompts

### Complete Removal
To remove all user data:
1. Uninstall application normally
2. Delete folder: `%APPDATA%\Elemental Genius`
3. Delete folder: `%LOCALAPPDATA%\Elemental Genius`

## 📞 Support

### Getting Help
- **Built-in Help**: Click Help > User Guide within the app
- **Website**: [https://elementalgenius.com/support](https://elementalgenius.com/support)
- **Email**: support@elementalgenius.com
- **GitHub Issues**: [Report bugs and request features](https://github.com/elemental-genius/desktop-app/issues)

### System Information
When contacting support, please include:
- Windows version (Settings > System > About)
- App version (Help > About Elemental Genius)
- Error messages (if any)
- Steps to reproduce the issue

## 🎉 You're Ready!

Congratulations! Elemental Genius is now installed and ready to help your child develop phonemic awareness skills through engaging, interactive learning.

**Next Steps:**
1. Create child profiles
2. Choose age-appropriate learning companions
3. Start with Week 1 activities
4. Explore avatar customization
5. Set up parent monitoring (optional)

**Happy Learning!** 🌟