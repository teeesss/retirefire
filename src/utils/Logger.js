/**
 * Environment-aware logging utility
 * Logs are suppressed in production builds for performance and security
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Logger with environment-gated console methods
 * In production: only errors are logged
 * In development: all log levels are enabled
 */
export const Logger = {
    /**
     * Debug logging - only in development
     * Use for detailed debugging information
     */
    debug: (...args) => {
        if (isDev) console.log(...args);
    },

    /**
     * Info logging - only in development
     * Use for general information
     */
    info: (...args) => {
        if (isDev) console.info(...args);
    },

    /**
     * Warning logging - only in development
     * Use for recoverable issues
     */
    warn: (...args) => {
        if (isDev) console.warn(...args);
    },

    /**
     * Error logging - always enabled
     * Use for errors that should be tracked in production
     */
    error: (...args) => {
        console.error(...args);
    },

    /**
     * Performance timing - only in development
     * Use for measuring execution time
     */
    time: (label) => {
        if (isDev) console.time(label);
    },

    /**
     * End performance timing - only in development
     */
    timeEnd: (label) => {
        if (isDev) console.timeEnd(label);
    },

    /**
     * Table logging - only in development
     * Use for displaying structured data
     */
    table: (data) => {
        if (isDev) console.table(data);
    }
};
