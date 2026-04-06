/**
 * API Client Module
 * Handles HTTP requests to the backend service
 */

export class ApiClient {
  /**
   * Default configuration
   */
  static DEFAULT_TIMEOUT = 30000; // 30 seconds

  constructor(baseUrl, timeout = ApiClient.DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Submit simulation request
   * @param {Object} payload - Simulation payload
   * @returns {Promise<Object>} Response data
   * @throws {Error} On network or HTTP errors
   */
  async submitSimulation(payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Correlation-Id': this._generateCorrelationId()
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Store response for error handling
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = response;
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Generate unique correlation ID for request tracing
   * @private
   */
  _generateCorrelationId() {
    return crypto.randomUUID();
  }

  /**
   * Update base URL
   * @param {string} url - New base URL
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Update timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  setTimeout(timeout) {
    this.timeout = timeout;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout
    };
  }
}

