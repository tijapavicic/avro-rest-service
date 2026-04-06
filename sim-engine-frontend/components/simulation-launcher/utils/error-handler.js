/**
 * Error Handling Module
 * Categorizes and formats errors for display
 */

export class ErrorHandler {
  /**
   * Error type constants
   */
  static TYPES = {
    VALIDATION: 'VALIDATION_ERROR',
    NETWORK: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    BAD_REQUEST: 'BAD_REQUEST',
    AUTH: 'AUTH_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMIT: 'RATE_LIMIT',
    SERVER: 'SERVER_ERROR',
    PARSE: 'PARSE_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
  };

  /**
   * Analyze error and return structured error details
   * @param {Error} error - The error object
   * @param {Response} response - Optional HTTP response
   * @returns {Object} Error details object
   */
  static getErrorDetails(error, response = null) {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: this.TYPES.NETWORK,
        title: 'Network Error',
        message: 'Unable to connect to the backend service',
        suggestion: 'Check if the backend is running and the URL is correct',
        technical: error.message
      };
    }

    // Timeout errors
    if (error.name === 'AbortError') {
      return {
        type: this.TYPES.TIMEOUT,
        title: 'Request Timeout',
        message: 'The request took too long to complete',
        suggestion: 'The backend may be overloaded. Please try again',
        technical: 'Request exceeded 30 second timeout'
      };
    }

    // HTTP errors
    if (response) {
      return this._handleHttpError(response);
    }

    // JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        type: this.TYPES.PARSE,
        title: 'Invalid Response',
        message: 'The server returned an invalid response',
        suggestion: 'The backend may be misconfigured. Contact support',
        technical: error.message
      };
    }

    // Generic error
    return {
      type: this.TYPES.UNKNOWN,
      title: 'Unexpected Error',
      message: error.message || 'An unknown error occurred',
      suggestion: 'Please try again or contact support if the issue persists',
      technical: error.stack || error.toString()
    };
  }

  /**
   * Handle HTTP status code errors
   * @private
   */
  static _handleHttpError(response) {
    const statusCode = response.status;

    const errorMap = {
      400: {
        type: this.TYPES.BAD_REQUEST,
        title: 'Invalid Request',
        message: 'The server rejected the request parameters',
        suggestion: 'Check parameter values and try again'
      },
      401: {
        type: this.TYPES.AUTH,
        title: 'Authentication Error',
        message: 'You are not authorized to perform this action',
        suggestion: 'Please check your credentials or contact support'
      },
      403: {
        type: this.TYPES.AUTH,
        title: 'Authorization Error',
        message: 'You do not have permission to perform this action',
        suggestion: 'Contact your administrator for access'
      },
      404: {
        type: this.TYPES.NOT_FOUND,
        title: 'Endpoint Not Found',
        message: 'The simulation API endpoint was not found',
        suggestion: 'Verify the backend-url attribute is correct'
      },
      429: {
        type: this.TYPES.RATE_LIMIT,
        title: 'Too Many Requests',
        message: 'Rate limit exceeded',
        suggestion: 'Please wait a moment before trying again'
      }
    };

    // Check for specific status codes
    if (errorMap[statusCode]) {
      return {
        ...errorMap[statusCode],
        technical: `HTTP ${statusCode}: ${response.statusText}`
      };
    }

    // Handle 5xx server errors
    if (statusCode >= 500) {
      return {
        type: this.TYPES.SERVER,
        title: 'Server Error',
        message: 'The backend service encountered an error',
        suggestion: 'The issue is on the server side. Please try again later',
        technical: `HTTP ${statusCode}: ${response.statusText}`
      };
    }

    // Default HTTP error
    return {
      type: this.TYPES.UNKNOWN,
      title: 'HTTP Error',
      message: `Unexpected HTTP status: ${statusCode}`,
      suggestion: 'Please contact support if the issue persists',
      technical: `HTTP ${statusCode}: ${response.statusText}`
    };
  }

  /**
   * Format validation errors for display
   * @param {Array<string>} errors - Array of validation error messages
   * @returns {string} HTML string
   */
  static formatValidationErrors(errors) {
    return `
      <span class="badge badge-error">${this.TYPES.VALIDATION}</span>
      <div style="margin-top: 0.5rem; text-align: left;">
        <ul style="margin: 0; padding-left: 1.5rem; color: #f87171;">
          ${errors.map(err => `<li>${err}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  /**
   * Format error details for display
   * @param {Object} errorDetails - Error details object
   * @returns {string} HTML string
   */
  static formatError(errorDetails) {
    return `
      <div style="text-align: left;">
        <div style="margin-bottom: 0.75rem;">
          <span class="badge badge-error">${errorDetails.type}</span>
          <strong style="margin-left: 0.5rem; color: #f87171;">${errorDetails.title}</strong>
        </div>
        <div style="margin-bottom: 0.5rem; color: #e2e8f0;">
          ${errorDetails.message}
        </div>
        <div style="margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.85rem;">
          💡 <em>${errorDetails.suggestion}</em>
        </div>
        <details style="margin-top: 0.5rem;">
          <summary style="cursor: pointer; color: #64748b; font-size: 0.8rem;">
            Technical Details
          </summary>
          <pre style="margin-top: 0.5rem; padding: 0.5rem; background: #0f1117; border-radius: 4px; font-size: 0.75rem; color: #94a3b8; overflow-x: auto;">${errorDetails.technical}</pre>
        </details>
      </div>
    `;
  }
}

