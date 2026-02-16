const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Voice processing utilities
  startVoiceRecording: () => ipcRenderer.invoke('start-voice-recording'),
  stopVoiceRecording: () => ipcRenderer.invoke('stop-voice-recording'),
  
  // Notification utilities
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // File system utilities (if needed)
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  
  // App control
  quitApp: () => ipcRenderer.invoke('quit-app'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  maximizeApp: () => ipcRenderer.invoke('maximize-app'),
  
  // Security utilities
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});