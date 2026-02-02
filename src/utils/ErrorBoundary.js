import { Logger } from './Logger.js';

/**
 * Global Error Boundary
 * Catches unhandled errors and promise rejections to prevent app crashes
 */
export class ErrorBoundary {
    static isInitialized = false;
    static errorCount = 0;
    static MAX_ERRORS = 10; // Prevent infinite error loops

    /**
     * Initialize global error handlers
     */
    static init() {
        if (this.isInitialized) {
            Logger.warn('ErrorBoundary already initialized');
            return;
        }

        // Handle synchronous errors
        window.addEventListener('error', (event) => {
            this.handleError(
                event.error,
                event.message,
                event.filename,
                event.lineno,
                event.colno
            );
            event.preventDefault(); // Prevent default browser error handling
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(
                event.reason,
                'Unhandled Promise Rejection',
                null,
                null,
                null
            );
            event.preventDefault();
        });

        this.isInitialized = true;
        Logger.debug('✅ ErrorBoundary initialized');
    }

    /**
     * Handle caught errors
     * @param {Error} error - Error object
     * @param {string} message - Error message
     * @param {string} source - Source file
     * @param {number} lineno - Line number
     * @param {number} colno - Column number
     */
    static handleError(error, message, source, lineno, colno) {
        this.errorCount++;

        // Prevent infinite error loops
        if (this.errorCount > this.MAX_ERRORS) {
            console.error('Too many errors detected. Stopping error handling.');
            return;
        }

        // Log error details
        Logger.error('🚨 UNHANDLED ERROR:', {
            message,
            error: error?.stack || error,
            source,
            line: lineno,
            column: colno,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // Show user-friendly error message
        this.showErrorUI(message, error);

        // Reset error count after 5 seconds
        setTimeout(() => {
            this.errorCount = Math.max(0, this.errorCount - 1);
        }, 5000);
    }

    /**
     * Display error UI to user
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    static showErrorUI(message, error) {
        // Check if error container exists
        let errorDiv = document.getElementById('global-error-boundary');

        if (!errorDiv) {
            // Create error container if it doesn't exist
            errorDiv = document.createElement('div');
            errorDiv.id = 'global-error-boundary';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                max-width: 600px;
                width: 90%;
            `;
            document.body.appendChild(errorDiv);
        }

        // Create error message
        const errorHTML = `
            <div style="
                background: linear-gradient(135deg, #fee 0%, #fdd 100%);
                border: 2px solid #c00;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                animation: slideDown 0.3s ease-out;
            ">
                <h3 style="margin: 0 0 10px 0; color: #c00; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">⚠️</span>
                    Application Error
                </h3>
                <p style="margin: 0 0 15px 0; color: #333;">
                    An unexpected error occurred. The application may not function correctly.
                </p>
                <details style="margin-bottom: 15px;">
                    <summary style="cursor: pointer; color: #666; font-size: 14px;">
                        Technical Details
                    </summary>
                    <pre style="
                        background: #fff;
                        padding: 10px;
                        border-radius: 4px;
                        overflow-x: auto;
                        font-size: 12px;
                        margin-top: 10px;
                    ">${this.escapeHtml(message)}\n\n${this.escapeHtml(error?.stack || '')}</pre>
                </details>
                <div style="display: flex; gap: 10px;">
                    <button onclick="location.reload()" style="
                        background: #c00;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">
                        Reload Page
                    </button>
                    <button onclick="document.getElementById('global-error-boundary').remove()" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        errorDiv.innerHTML = errorHTML;

        // Add animation
        if (!document.querySelector('#error-boundary-styles')) {
            const style = document.createElement('style');
            style.id = 'error-boundary-styles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Escape HTML to prevent XSS in error messages
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Manually report an error
     * @param {Error} error - Error to report
     * @param {Object} context - Additional context
     */
    static reportError(error, context = {}) {
        this.handleError(error, error.message, context.source, context.line, context.column);
    }
}
