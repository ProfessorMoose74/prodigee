const { version, description, author } = require('./package.json');

module.exports = {
  appId: 'com.elementalgenius.desktop',
  productName: 'Elemental Genius',
  copyright: `Copyright © ${new Date().getFullYear()} ${author}`,
  
  // Directories
  directories: {
    output: 'dist',
    buildResources: 'build',
  },
  
  // Files to include
  files: [
    'build/**/*',
    'public/electron.js',
    'public/preload.js',
    'node_modules/**/*',
    '!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!node_modules/*.d.ts',
    '!node_modules/.bin',
    '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
    '!.editorconfig',
    '!**/._*',
    '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
    '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
    '!**/{appveyor.yml,.travis.yml,circle.yml}',
    '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}',
  ],
  
  // Compression
  compression: 'maximum',
  
  // Windows configuration
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      },
      {
        target: 'portable',
        arch: ['x64', 'ia32']
      },
      {
        target: 'msi',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.ico',
    publisherName: 'Elemental Genius',
    verifyUpdateCodeSignature: false,
    requestedExecutionLevel: 'asInvoker',
    artifactName: '${productName}-Setup-${version}-${arch}.${ext}',
  },
  
  // NSIS Windows Installer
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
    installerHeaderIcon: 'assets/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Elemental Genius',
    include: 'build/installer.nsh',
    license: 'LICENSE',
    warningsAsErrors: false,
    runAfterFinish: true,
    deleteAppDataOnUninstall: false,
  },
  
  // Portable Windows
  portable: {
    artifactName: '${productName}-Portable-${version}-${arch}.${ext}',
  },
  
  // MSI Windows Installer
  msi: {
    artifactName: '${productName}-${version}-${arch}.${ext}',
    oneClick: false,
    upgradeCode: 'B4F7E7A0-1234-5678-9ABC-DEF012345678',
  },
  
  // macOS configuration
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      },
      {
        target: 'pkg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'assets/icon.icns',
    category: 'public.app-category.education',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.plist',
    entitlementsInherit: 'build/entitlements.plist',
    notarize: {
      teamId: process.env.APPLE_TEAM_ID || '',
    },
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },
  
  // DMG macOS
  dmg: {
    title: '${productName} ${version}',
    icon: 'assets/icon.icns',
    iconSize: 100,
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    },
    backgroundColor: '#ffffff',
    format: 'ULFO',
  },
  
  // PKG macOS Installer
  pkg: {
    allowAnywhere: false,
    allowCurrentUserHome: false,
    allowRootDirectory: false,
    installLocation: '/Applications',
    scripts: 'build/pkg-scripts',
  },
  
  // Linux configuration (for future support)
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      },
      {
        target: 'tar.gz',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.png',
    category: 'Education',
    description: description,
    desktop: {
      Name: 'Elemental Genius',
      Comment: 'Educational phonemic awareness platform',
      Categories: 'Education;Teaching;AudioVideo;',
      StartupWMClass: 'elemental-genius',
    },
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },
  
  // Auto-updater
  publish: {
    provider: 'github',
    owner: 'elemental-genius',
    repo: 'desktop-app',
    private: false,
    releaseType: 'release',
  },
  
  // Build optimization
  buildDependenciesFromSource: false,
  nodeGypRebuild: false,
  npmRebuild: true,
  
  // Metadata
  extraMetadata: {
    name: 'elemental-genius',
    version: version,
  },
  
  // File associations
  fileAssociations: [
    {
      ext: 'egdata',
      name: 'Elemental Genius Data',
      description: 'Elemental Genius user data file',
      icon: 'assets/file-icon.ico',
      role: 'Editor',
    }
  ],
  
  // Protocol handling
  protocols: [
    {
      name: 'Elemental Genius Protocol',
      schemes: ['elemental-genius']
    }
  ],
  
  // Additional resources
  extraResources: [
    {
      from: 'assets/',
      to: 'assets/',
      filter: ['**/*']
    },
    {
      from: 'curriculum/',
      to: 'curriculum/',
      filter: ['**/*']
    }
  ],
  
  // Environment
  buildVersion: process.env.BUILD_NUMBER || version,
  
  // Security
  afterSign: 'scripts/notarize.js',
  afterAllArtifactBuild: 'scripts/cleanup.js',
  
  // Remote debugging (development only)
  remoteBuild: false,
  
  // Snap configuration (Linux)
  snap: {
    grade: 'stable',
    confinement: 'strict',
    summary: 'Dr. Heggerty phonemic awareness curriculum platform',
    description: 'A comprehensive desktop application for Dr. Michael Heggerty\'s phonemic awareness curriculum with voice processing, character interactions, and parent monitoring.',
    category: 'education',
    desktop: {
      'StartupWMClass': 'elemental-genius'
    },
    slots: [
      {
        'audio-playback': {
          interface: 'pulseaudio'
        },
        'audio-record': {
          interface: 'pulseaudio'
        }
      }
    ],
    plugs: [
      'default',
      'audio-playback',
      'audio-record',
      'network',
      'network-bind',
      'home',
      'desktop',
      'desktop-legacy',
      'x11',
      'wayland',
      'unity7',
      'browser-support'
    ]
  }
};