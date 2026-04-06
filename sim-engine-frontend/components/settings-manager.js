/**
 * Settings Manager
 * Manages application settings and configuration
 */

class SettingsManager {
  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    const stored = localStorage.getItem('sim-settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }

    // Default settings
    return {
      apiEndpoint: 'http://localhost:8082/api/simulations',
      systemId: 'SYS-001',
      timeout: 10000,
      theme: 'dark',
      enableAnalytics: true,
      enableNotifications: true,
      autoRefresh: false,
      refreshInterval: 30,
      defaultParameters: {
        p1: '10.5',
        q1: '25.0',
        r1: '3.14'
      },
      advanced: {
        enableDebugMode: false,
        enableVerboseLogging: false,
        retryFailedRequests: true,
        maxRetries: 3
      }
    };
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    localStorage.setItem('sim-settings', JSON.stringify(this.settings));
    this.applySettings();
  }

  /**
   * Apply settings to the application
   */
  applySettings() {
    // Update simulation launcher if exists
    const launcher = document.querySelector('simulation-launcher');
    if (launcher) {
      launcher.setAttribute('backend-url', this.settings.apiEndpoint);
      launcher.setAttribute('system-id', this.settings.systemId);

      // Update default parameters
      if (launcher.parameters) {
        launcher.parameters = { ...this.settings.defaultParameters };
      }
    }

    // Apply theme (future enhancement)
    document.documentElement.setAttribute('data-theme', this.settings.theme);

    // Trigger settings change event
    window.dispatchEvent(new CustomEvent('settings-changed', {
      detail: this.settings
    }));
  }

  /**
   * Render settings panel
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
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

    this.attachEventListeners();
  }

  /**
   * Attach event listeners to form elements
   */
  attachEventListeners() {
    // Save button
    document.getElementById('save-settings')?.addEventListener('click', () => {
      this.collectAndSaveSettings();
    });

    // Reset button
    document.getElementById('reset-settings')?.addEventListener('click', () => {
      this.resetToDefaults();
    });

    // Clear analytics button
    document.getElementById('clear-analytics')?.addEventListener('click', () => {
      if (window.analyticsManager) {
        window.analyticsManager.clearData();
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
   */
  collectAndSaveSettings() {
    this.settings = {
      apiEndpoint: document.getElementById('api-endpoint').value,
      systemId: document.getElementById('system-id').value,
      timeout: parseInt(document.getElementById('timeout').value),
      theme: this.settings.theme,
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

    this.saveSettings();
    this.showNotification('Settings saved successfully!', 'success');
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      localStorage.removeItem('sim-settings');
      this.settings = this.loadSettings();
      this.render('settings-content');
      this.showNotification('Settings reset to defaults', 'info');
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
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

  /**
   * Get current settings
   */
  getSettings() {
    return this.settings;
  }
}

// Export as global
window.SettingsManager = SettingsManager;

