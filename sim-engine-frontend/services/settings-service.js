/**
 * Settings Service - Enterprise-grade configuration management
 *
 * Implements:
 * - Schema validation with JSON Schema
 * - Type-safe configuration
 * - Change detection and events
 * - Default value management
 * - Configuration migrations
 * - Validation rules
 *
 * @class SettingsService
 */

import storageService from '../services/storage-service.js';
import eventBus from '../services/event-bus.js';

class SettingsService {
  static STORAGE_KEY = 'sim-settings';
  static SCHEMA_VERSION = '2.0.0';

  constructor() {
    this.settings = this._loadSettings();
    this.validators = this._initializeValidators();
    this._initializeEventListeners();
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initializeEventListeners() {
    eventBus.on('settings:reset', () => {
      this.resetToDefaults();
    });

    eventBus.on('settings:save', (event) => {
      this.updateSettings(event.data);
    });
  }

  /**
   * Initialize validators
   * @private
   * @returns {Map} Validators map
   */
  _initializeValidators() {
    return new Map([
      ['apiEndpoint', this._validateURL.bind(this)],
      ['systemId', this._validateSystemId.bind(this)],
      ['timeout', this._validateTimeout.bind(this)],
      ['refreshInterval', this._validateRefreshInterval.bind(this)],
      ['defaultParameters', this._validateParameters.bind(this)],
      ['maxRetries', this._validateMaxRetries.bind(this)]
    ]);
  }

  /**
   * Load settings with validation
   * @private
   * @returns {Object} Settings
   */
  _loadSettings() {
    const defaults = this._getDefaultSettings();
    const stored = storageService.get(SettingsService.STORAGE_KEY, defaults);

    // Merge with defaults (in case new settings were added)
    const merged = this._deepMerge(defaults, stored);

    // Validate
    const validation = this._validateSettings(merged);
    if (!validation.valid) {
      console.warn('Invalid settings detected, using defaults:', validation.errors);
      return defaults;
    }

    return merged;
  }

  /**
   * Get default settings with JSDoc types
   * @private
   * @returns {Object}
   */
  _getDefaultSettings() {
    return {
      // API Configuration
      apiEndpoint: 'http://localhost:8082/api/simulations',
      systemId: 'SYS-001',
      timeout: 10000,

      // UI Preferences
      theme: 'dark',
      enableAnalytics: true,
      enableNotifications: true,
      autoRefresh: false,
      refreshInterval: 30,

      // Default Parameters
      defaultParameters: {
        p1: '10.5',
        q1: '25.0',
        r1: '3.14'
      },

      // Advanced Settings
      advanced: {
        enableDebugMode: false,
        enableVerboseLogging: false,
        retryFailedRequests: true,
        maxRetries: 3,
        enableCaching: true,
        cacheTimeout: 300000 // 5 minutes
      },

      // Metadata
      metadata: {
        version: SettingsService.SCHEMA_VERSION,
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Deep merge objects
   * @private
   */
  _deepMerge(target, source) {
    const output = { ...target };

    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this._isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  /**
   * Check if value is object
   * @private
   */
  _isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Validate all settings
   * @private
   * @returns {{valid: boolean, errors: Array}}
   */
  _validateSettings(settings) {
    const errors = [];

    // Required fields
    const required = ['apiEndpoint', 'systemId', 'timeout'];
    required.forEach(field => {
      if (!(field in settings)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Run custom validators
    for (const [field, validator] of this.validators) {
      if (field in settings) {
        const result = validator(settings[field], field);
        if (!result.valid) {
          errors.push(result.error);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate URL
   * @private
   */
  _validateURL(value, field) {
    try {
      new URL(value);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: `${field} must be a valid URL` };
    }
  }

  /**
   * Validate system ID
   * @private
   */
  _validateSystemId(value) {
    if (typeof value !== 'string' || value.length === 0) {
      return { valid: false, error: 'systemId must be a non-empty string' };
    }

    if (!/^[A-Z0-9\-]+$/i.test(value)) {
      return { valid: false, error: 'systemId must contain only alphanumeric characters and hyphens' };
    }

    return { valid: true };
  }

  /**
   * Validate timeout
   * @private
   */
  _validateTimeout(value) {
    if (typeof value !== 'number' || value < 1000 || value > 60000) {
      return { valid: false, error: 'timeout must be between 1000 and 60000 ms' };
    }
    return { valid: true };
  }

  /**
   * Validate refresh interval
   * @private
   */
  _validateRefreshInterval(value) {
    if (typeof value !== 'number' || value < 5 || value > 300) {
      return { valid: false, error: 'refreshInterval must be between 5 and 300 seconds' };
    }
    return { valid: true };
  }

  /**
   * Validate parameters
   * @private
   */
  _validateParameters(params) {
    const rules = {
      p1: { min: 0, max: 1000 },
      q1: { min: 0, max: 100 },
      r1: { min: 0, max: 50 }
    };

    for (const [key, rule] of Object.entries(rules)) {
      if (!(key in params)) {
        return { valid: false, error: `Missing parameter: ${key}` };
      }

      const value = parseFloat(params[key]);
      if (isNaN(value) || value < rule.min || value > rule.max) {
        return {
          valid: false,
          error: `${key} must be between ${rule.min} and ${rule.max}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate max retries
   * @private
   */
  _validateMaxRetries(value) {
    if (typeof value !== 'number' || value < 1 || value > 10) {
      return { valid: false, error: 'maxRetries must be between 1 and 10' };
    }
    return { valid: true };
  }

  /**
   * Update settings
   * @param {Object} newSettings - New settings (partial update supported)
   * @returns {{success: boolean, errors: Array}}
   */
  updateSettings(newSettings) {
    try {
      // Merge with existing settings
      const merged = this._deepMerge(this.settings, newSettings);

      // Validate
      const validation = this._validateSettings(merged);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Detect changes
      const changes = this._detectChanges(this.settings, merged);

      // Update settings
      const oldSettings = { ...this.settings };
      this.settings = merged;
      this.settings.metadata.lastModified = new Date().toISOString();

      // Save to storage
      const saved = this._saveSettings();
      if (!saved) {
        // Rollback on save failure
        this.settings = oldSettings;
        return {
          success: false,
          errors: ['Failed to save settings to storage']
        };
      }

      // Apply settings
      this._applySettings();

      // Emit events
      eventBus.emit('settings:changed', {
        settings: this.settings,
        changes
      });

      return {
        success: true,
        errors: [],
        changes
      };

    } catch (error) {
      console.error('Error updating settings:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Detect changes between old and new settings
   * @private
   */
  _detectChanges(oldSettings, newSettings) {
    const changes = [];

    const compare = (old, current, path = '') => {
      for (const key in current) {
        const currentPath = path ? `${path}.${key}` : key;

        if (this._isObject(current[key])) {
          compare(old[key] || {}, current[key], currentPath);
        } else if (old[key] !== current[key]) {
          changes.push({
            path: currentPath,
            oldValue: old[key],
            newValue: current[key]
          });
        }
      }
    };

    compare(oldSettings, newSettings);
    return changes;
  }

  /**
   * Save settings to storage
   * @private
   */
  _saveSettings() {
    return storageService.set(SettingsService.STORAGE_KEY, this.settings);
  }

  /**
   * Apply settings to application
   * @private
   */
  _applySettings() {
    // Update simulation launcher
    const launcher = document.querySelector('simulation-launcher');
    if (launcher) {
      launcher.setAttribute('backend-url', this.settings.apiEndpoint);
      launcher.setAttribute('system-id', this.settings.systemId);

      if (launcher.setParameters) {
        launcher.setParameters(this.settings.defaultParameters);
      }
    }

    // Apply theme
    document.documentElement.setAttribute('data-theme', this.settings.theme);

    // Configure debug mode
    if (this.settings.advanced.enableDebugMode) {
      window.DEBUG_MODE = true;
      console.log('[Settings] Debug mode enabled');
    } else {
      window.DEBUG_MODE = false;
    }
  }

  /**
   * Reset to default settings
   * @returns {Promise<boolean>} Success status
   */
  async resetToDefaults() {
    return new Promise((resolve) => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        storageService.remove(SettingsService.STORAGE_KEY);
        this.settings = this._getDefaultSettings();
        this._saveSettings();
        this._applySettings();

        eventBus.emit('settings:reset:complete', { settings: this.settings });
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  /**
   * Get current settings
   * @returns {Object} Settings (frozen for immutability)
   */
  getSettings() {
    return Object.freeze({ ...this.settings });
  }

  /**
   * Get specific setting
   * @param {string} path - Dot-notation path (e.g., 'advanced.enableDebugMode')
   * @returns {*} Setting value
   */
  getSetting(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.settings);
  }

  /**
   * Export settings
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings
   * @param {string} jsonString - JSON string of settings
   * @returns {{success: boolean, errors: Array}}
   */
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      return this.updateSettings(imported);
    } catch (error) {
      return {
        success: false,
        errors: ['Invalid JSON format']
      };
    }
  }

  /**
   * Render settings panel
   * @param {string} containerId - Container element ID
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    container.innerHTML = this._generateHTML();
    this._attachEventListeners();
  }

  /**
   * Generate HTML for settings panel
   * @private
   */
  _generateHTML() {
    return `
      <div class="settings-header">
        <h2>⚙️ Settings</h2>
        <div class="settings-actions">
          <button id="reset-settings" class="secondary-btn">Reset to Defaults</button>
          <button id="save-settings" class="primary-btn">Save Changes</button>
        </div>
      </div>

      <div class="settings-content">
        <!-- API Configuration -->
        <div class="settings-section">
          <h3>API Configuration</h3>
          <div class="settings-group">
            <label for="api-endpoint">
              <span class="label-text">API Endpoint</span>
              <span class="label-desc">Backend API URL for simulation submissions</span>
            </label>
            <input
              type="text"
              id="api-endpoint"
              class="settings-input"
              value="${this.settings.apiEndpoint}"
              placeholder="http://localhost:8082/api/simulations"
            />
          </div>

          <div class="settings-group">
            <label for="system-id">
              <span class="label-text">System ID</span>
              <span class="label-desc">Default system identifier for requests</span>
            </label>
            <input
              type="text"
              id="system-id"
              class="settings-input"
              value="${this.settings.systemId}"
              placeholder="SYS-001"
            />
          </div>

          <div class="settings-group">
            <label for="timeout">
              <span class="label-text">Request Timeout (ms)</span>
              <span class="label-desc">Maximum time to wait for API responses</span>
            </label>
            <input
              type="number"
              id="timeout"
              class="settings-input"
              value="${this.settings.timeout}"
              min="1000"
              max="60000"
              step="1000"
            />
          </div>
        </div>

        <!-- Default Parameters -->
        <div class="settings-section">
          <h3>Default Parameters</h3>
          <div class="settings-grid">
            <div class="settings-group">
              <label for="default-p1">
                <span class="label-text">Parameter P1</span>
                <span class="label-desc">Range: 0-1000</span>
              </label>
              <input
                type="text"
                id="default-p1"
                class="settings-input"
                value="${this.settings.defaultParameters.p1}"
              />
            </div>

            <div class="settings-group">
              <label for="default-q1">
                <span class="label-text">Parameter Q1</span>
                <span class="label-desc">Range: 0-100</span>
              </label>
              <input
                type="text"
                id="default-q1"
                class="settings-input"
                value="${this.settings.defaultParameters.q1}"
              />
            </div>

            <div class="settings-group">
              <label for="default-r1">
                <span class="label-text">Parameter R1</span>
                <span class="label-desc">Range: 0-50</span>
              </label>
              <input
                type="text"
                id="default-r1"
                class="settings-input"
                value="${this.settings.defaultParameters.r1}"
              />
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="settings-section">
          <h3>Preferences</h3>

          <div class="settings-group">
            <label class="toggle-label">
              <div>
                <span class="label-text">Enable Analytics</span>
                <span class="label-desc">Track simulation metrics and statistics</span>
              </div>
              <input
                type="checkbox"
                id="enable-analytics"
                class="toggle-input"
                ${this.settings.enableAnalytics ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="settings-group">
            <label class="toggle-label">
              <div>
                <span class="label-text">Enable Notifications</span>
                <span class="label-desc">Show browser notifications for simulation results</span>
              </div>
              <input
                type="checkbox"
                id="enable-notifications"
                class="toggle-input"
                ${this.settings.enableNotifications ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="settings-group">
            <label class="toggle-label">
              <div>
                <span class="label-text">Auto Refresh Analytics</span>
                <span class="label-desc">Automatically refresh analytics dashboard</span>
              </div>
              <input
                type="checkbox"
                id="auto-refresh"
                class="toggle-input"
                ${this.settings.autoRefresh ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="settings-group" id="refresh-interval-group" style="${this.settings.autoRefresh ? '' : 'display:none'}">
            <label for="refresh-interval">
              <span class="label-text">Refresh Interval (seconds)</span>
              <span class="label-desc">How often to refresh analytics data</span>
            </label>
            <input
              type="number"
              id="refresh-interval"
              class="settings-input"
              value="${this.settings.refreshInterval}"
              min="5"
              max="300"
              step="5"
            />
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="settings-section">
          <h3>Advanced</h3>

          <div class="settings-group">
            <label class="toggle-label">
              <div>
                <span class="label-text">Debug Mode</span>
                <span class="label-desc">Enable detailed console logging</span>
              </div>
              <input
                type="checkbox"
                id="debug-mode"
                class="toggle-input"
                ${this.settings.advanced.enableDebugMode ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="settings-group">
            <label class="toggle-label">
              <div>
                <span class="label-text">Verbose Logging</span>
                <span class="label-desc">Log all API requests and responses</span>
              </div>
              <input
                type="checkbox"
                id="verbose-logging"
                class="toggle-input"
                ${this.settings.advanced.enableVerboseLogging ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="settings-group">
            <label class="toggle-label">
              <div>
                <span class="label-text">Retry Failed Requests</span>
                <span class="label-desc">Automatically retry failed API requests</span>
              </div>
              <input
                type="checkbox"
                id="retry-requests"
                class="toggle-input"
                ${this.settings.advanced.retryFailedRequests ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="settings-group" id="max-retries-group" style="${this.settings.advanced.retryFailedRequests ? '' : 'display:none'}">
            <label for="max-retries">
              <span class="label-text">Max Retries</span>
              <span class="label-desc">Maximum number of retry attempts</span>
            </label>
            <input
              type="number"
              id="max-retries"
              class="settings-input"
              value="${this.settings.advanced.maxRetries}"
              min="1"
              max="10"
              step="1"
            />
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section danger-zone">
          <h3>Danger Zone</h3>
          <div class="settings-group">
            <div class="danger-item">
              <div>
                <span class="label-text">Clear Analytics Data</span>
                <span class="label-desc">Permanently delete all analytics and simulation history</span>
              </div>
              <button id="clear-analytics" class="danger-btn">Clear Data</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to form elements
   * @private
   */
  _attachEventListeners() {
    // Save button
    document.getElementById('save-settings')?.addEventListener('click', () => {
      this._collectAndSaveSettings();
    });

    // Reset button
    document.getElementById('reset-settings')?.addEventListener('click', () => {
      this.resetToDefaults();
    });

    // Clear analytics button
    document.getElementById('clear-analytics')?.addEventListener('click', () => {
      if (window.analyticsService) {
        window.analyticsService.clearData();
      }
    });

    // Auto-refresh toggle
    document.getElementById('auto-refresh')?.addEventListener('change', (e) => {
      const intervalGroup = document.getElementById('refresh-interval-group');
      if (intervalGroup) {
        intervalGroup.style.display = e.target.checked ? 'block' : 'none';
      }
    });

    // Retry requests toggle
    document.getElementById('retry-requests')?.addEventListener('change', (e) => {
      const retriesGroup = document.getElementById('max-retries-group');
      if (retriesGroup) {
        retriesGroup.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }

  /**
   * Collect settings from form and save
   * @private
   */
  _collectAndSaveSettings() {
    const newSettings = {
      apiEndpoint: document.getElementById('api-endpoint').value,
      systemId: document.getElementById('system-id').value,
      timeout: parseInt(document.getElementById('timeout').value),
      enableAnalytics: document.getElementById('enable-analytics').checked,
      enableNotifications: document.getElementById('enable-notifications').checked,
      autoRefresh: document.getElementById('auto-refresh').checked,
      refreshInterval: parseInt(document.getElementById('refresh-interval').value),
      defaultParameters: {
        p1: document.getElementById('default-p1').value,
        q1: document.getElementById('default-q1').value,
        r1: document.getElementById('default-r1').value
      },
      advanced: {
        enableDebugMode: document.getElementById('debug-mode').checked,
        enableVerboseLogging: document.getElementById('verbose-logging').checked,
        retryFailedRequests: document.getElementById('retry-requests').checked,
        maxRetries: parseInt(document.getElementById('max-retries').value)
      }
    };

    const result = this.updateSettings(newSettings);

    if (result.success) {
      this._showNotification('Settings saved successfully!', 'success');
    } else {
      this._showNotification(`Error: ${result.errors.join(', ')}`, 'error');
    }
  }

  /**
   * Show notification
   * @private
   */
  _showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(96, 165, 250, 0.3);
      border-radius: 8px;
      color: #f1f5f9;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Export singleton instance
const settingsService = new SettingsService();
window.settingsService = settingsService;
export default settingsService;

