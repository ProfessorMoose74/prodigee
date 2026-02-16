import AsyncStorage from '@react-native-async-storage/async-storage';
import {crashReporting} from './CrashReporting';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  maxStoredLogs: number;
  enableConsoleOutput: boolean;
  enableRemoteLogging: boolean;
  enableFileLogging: boolean;
  categories: string[];
}

class Logger {
  private readonly LOGS_STORAGE_KEY = 'eg_logs';
  private readonly CONFIG_STORAGE_KEY = 'eg_logger_config';
  private readonly MAX_LOG_FILE_SIZE = 1024 * 1024; // 1MB

  private config: LoggerConfig = {
    minLevel: __DEV__ ? 'debug' : 'info',
    maxStoredLogs: 1000,
    enableConsoleOutput: __DEV__,
    enableRemoteLogging: !__DEV__,
    enableFileLogging: true,
    categories: [],
  };

  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  private userId?: string;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeConfig();
    this.startPeriodicFlush();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeConfig() {
    try {
      const storedConfig = await AsyncStorage.getItem(this.CONFIG_STORAGE_KEY);
      if (storedConfig) {
        this.config = {...this.config, ...JSON.parse(storedConfig)};
      }
    } catch (error) {
      console.error('Failed to load logger config:', error);
    }
  }

  private startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 30000); // Flush every 30 seconds
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setConfig(newConfig: Partial<LoggerConfig>) {
    this.config = {...this.config, ...newConfig};
    AsyncStorage.setItem(
      this.CONFIG_STORAGE_KEY,
      JSON.stringify(this.config),
    ).catch(error => console.error('Failed to save logger config:', error));
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    if (this.logLevels[level] < this.logLevels[this.config.minLevel]) {
      return false;
    }

    if (category && this.config.categories.length > 0) {
      return this.config.categories.includes(category);
    }

    return true;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    category: string = 'general',
    data?: Record<string, any>,
    error?: Error,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      stackTrace: error?.stack,
    };
  }

  private async processLog(entry: LogEntry) {
    // Console output
    if (this.config.enableConsoleOutput) {
      const logMethod =
        entry.level === 'debug'
          ? console.log
          : entry.level === 'info'
          ? console.info
          : entry.level === 'warn'
          ? console.warn
          : console.error;

      logMethod(
        `[${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`,
        entry.data || '',
      );
    }

    // Add to buffer for batch processing
    this.logBuffer.push(entry);

    // Critical logs should be processed immediately
    if (entry.level === 'error' || entry.level === 'fatal') {
      crashReporting.addBreadcrumb({
        message: entry.message,
        category: entry.category,
        level: entry.level === 'fatal' ? 'error' : entry.level,
        data: entry.data,
      });

      if (entry.level === 'fatal') {
        this.flushLogs(); // Immediate flush for fatal errors
      }
    }

    // Flush buffer if it gets too large
    if (this.logBuffer.length >= 50) {
      this.flushLogs();
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) {
      return;
    }

    try {
      const logsToFlush = [...this.logBuffer];
      this.logBuffer = [];

      if (this.config.enableFileLogging) {
        await this.storeLogsLocally(logsToFlush);
      }

      if (this.config.enableRemoteLogging) {
        await this.sendLogsToRemote(logsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-add logs to buffer if flush failed
      this.logBuffer.unshift(...this.logBuffer);
    }
  }

  private async storeLogsLocally(logs: LogEntry[]) {
    try {
      const existingLogs = await this.getStoredLogs();
      const allLogs = [...existingLogs, ...logs];

      // Keep only the most recent logs
      const trimmedLogs = allLogs.slice(-this.config.maxStoredLogs);

      await AsyncStorage.setItem(
        this.LOGS_STORAGE_KEY,
        JSON.stringify(trimmedLogs),
      );
    } catch (error) {
      console.error('Failed to store logs locally:', error);
    }
  }

  private async sendLogsToRemote(logs: LogEntry[]) {
    try {
      // In a production app, you would send logs to a remote service
      // Example implementations:

      // Custom logging endpoint
      // await fetch('https://your-logging-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs }),
      // });

      // Or integrate with services like:
      // - Datadog: DD_RUM.addLogs(logs)
      // - LogRocket: LogRocket.log(logs)
      // - Splunk: SplunkRUM.log(logs)

      console.log('📤 Would send logs to remote service:', logs.length);
    } catch (error) {
      console.error('Failed to send logs to remote service:', error);
    }
  }

  // Public logging methods
  debug(
    message: string,
    category: string = 'general',
    data?: Record<string, any>,
  ) {
    if (this.shouldLog('debug', category)) {
      const entry = this.createLogEntry('debug', message, category, data);
      this.processLog(entry);
    }
  }

  info(
    message: string,
    category: string = 'general',
    data?: Record<string, any>,
  ) {
    if (this.shouldLog('info', category)) {
      const entry = this.createLogEntry('info', message, category, data);
      this.processLog(entry);
    }
  }

  warn(
    message: string,
    category: string = 'general',
    data?: Record<string, any>,
  ) {
    if (this.shouldLog('warn', category)) {
      const entry = this.createLogEntry('warn', message, category, data);
      this.processLog(entry);
    }
  }

  error(
    message: string,
    category: string = 'general',
    data?: Record<string, any>,
    error?: Error,
  ) {
    if (this.shouldLog('error', category)) {
      const entry = this.createLogEntry(
        'error',
        message,
        category,
        data,
        error,
      );
      this.processLog(entry);
    }
  }

  fatal(
    message: string,
    category: string = 'general',
    data?: Record<string, any>,
    error?: Error,
  ) {
    if (this.shouldLog('fatal', category)) {
      const entry = this.createLogEntry(
        'fatal',
        message,
        category,
        data,
        error,
      );
      this.processLog(entry);
    }
  }

  // Specialized logging methods
  logUserAction(action: string, data?: Record<string, any>) {
    this.info(`User action: ${action}`, 'user_interaction', data);
  }

  logAPICall(
    method: string,
    url: string,
    duration: number,
    statusCode?: number,
  ) {
    this.info(`API call: ${method} ${url}`, 'api', {
      duration,
      statusCode,
      success: statusCode ? statusCode < 400 : undefined,
    });
  }

  logVoiceEvent(event: string, data?: Record<string, any>) {
    this.info(`Voice event: ${event}`, 'voice', data);
  }

  logNavigationEvent(screen: string, action: string = 'navigate') {
    this.info(`Navigation: ${action} to ${screen}`, 'navigation', {
      screen,
      action,
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string = 'ms') {
    this.info(`Performance: ${metric}`, 'performance', {value, unit});
  }

  // Log retrieval and management
  async getStoredLogs(): Promise<LogEntry[]> {
    try {
      const storedLogs = await AsyncStorage.getItem(this.LOGS_STORAGE_KEY);
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (error) {
      console.error('Failed to get stored logs:', error);
      return [];
    }
  }

  async getLogsByCategory(category: string): Promise<LogEntry[]> {
    const logs = await this.getStoredLogs();
    return logs.filter(log => log.category === category);
  }

  async getLogsByLevel(level: LogLevel): Promise<LogEntry[]> {
    const logs = await this.getStoredLogs();
    return logs.filter(log => log.level === level);
  }

  async getRecentLogs(hours: number = 24): Promise<LogEntry[]> {
    const logs = await this.getStoredLogs();
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return logs.filter(log => new Date(log.timestamp).getTime() > cutoffTime);
  }

  async clearLogs() {
    try {
      await AsyncStorage.removeItem(this.LOGS_STORAGE_KEY);
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  async exportLogs(): Promise<string> {
    const logs = await this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Performance monitoring helpers
  startTimer(label: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.logPerformanceMetric(label, duration);
    };
  }

  // Memory and resource monitoring
  logMemoryUsage() {
    // In a real app, you would use a library like react-native-device-info
    // to get actual memory usage
    this.debug('Memory usage check', 'performance', {
      timestamp: Date.now(),
      // heapUsed: DeviceInfo.getTotalMemorySync(),
      // heapTotal: DeviceInfo.getUsedMemorySync(),
    });
  }

  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs(); // Final flush
  }
}

export const logger = new Logger();
export type {LogLevel, LogEntry, LoggerConfig};
