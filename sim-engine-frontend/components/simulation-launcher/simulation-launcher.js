/**
 * <simulation-launcher> Web Component
 *
 * Modular architecture with separation of concerns:
 * - Validators: Input validation logic
 * - ErrorHandler: Error categorization and formatting
 * - ProgressManager: Progress bar state management
 * - ApiClient: HTTP request handling
 * - HtmlTemplate: HTML structure generation
 * - StyleLoader: CSS management
 *
 * @attributes
 *   backend-url  - Full URL of POST /api/simulations (default: http://localhost:8082/api/simulations)
 *   system-id    - systemId sent in request body (default: SYS-001)
 *
 * @example
 *   <simulation-launcher
 *     backend-url="http://localhost:8082/api/simulations"
 *     system-id="SYS-001">
 *   </simulation-launcher>
 */

import { ParameterValidator } from './utils/validators.js';
import { ErrorHandler } from './utils/error-handler.js';
import { ProgressManager } from './utils/progress-manager.js';
import { ApiClient } from './utils/api-client.js';
import { HtmlTemplate } from './templates/html-template.js';
import { StyleLoader } from './templates/style-loader.js';

class SimulationLauncher extends HTMLElement {

  /* ── Constructor ────────────────────────────────────── */

  constructor() {
    super();

    // Default parameter values
    this.parameters = {
      p1: '10.5',
      q1: '25.0',
      r1: '3.14'
    };

    // Component state
    this.progressManager = null;
    this.apiClient = null;
  }

  /* ── Lifecycle Hooks ────────────────────────────────── */

  connectedCallback() {
    this._render();
    this._initialize();
    this._attachEventListeners();
  }

  /* ── Attribute Observers ────────────────────────────── */

  static get observedAttributes() {
    return ['backend-url', 'system-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'backend-url' && this.apiClient) {
      this.apiClient.setBaseUrl(newValue);
    }
  }

  /* ── Private Initialization ─────────────────────────── */

  _initialize() {
    // Initialize API client
    const backendUrl = this.getAttribute('backend-url') ||
                      'http://localhost:8082/api/simulations';
    this.apiClient = new ApiClient(backendUrl);

    // Initialize progress manager
    const progressFill = this.shadowRoot.getElementById('progress-fill');
    const progressText = this.shadowRoot.getElementById('progress-text');
    this.progressManager = new ProgressManager(progressFill, progressText);
  }

  /* ── Rendering ──────────────────────────────────────── */

  _render() {
    this.attachShadow({ mode: 'open' });

    // Generate HTML template
    const html = HtmlTemplate.generate(this.parameters);

    // Load styles (inline for immediate rendering)
    const styles = StyleLoader.getInlineStyles();

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
  }

  /* ── Event Listeners ────────────────────────────────── */

  _attachEventListeners() {
    // Launch button
    const launchBtn = this.shadowRoot.getElementById('launch-btn');
    launchBtn.addEventListener('click', () => this._handleLaunch());

    // Parameter inputs
    ['p1', 'q1', 'r1'].forEach(param => {
      const input = this.shadowRoot.getElementById(`param-${param}`);
      input.addEventListener('input', (e) => {
        this.parameters[param] = e.target.value;
      });

      // Optional: Real-time validation feedback
      input.addEventListener('blur', (e) => {
        this._validateSingleParameter(param, e.target.value);
      });
    });
  }

  /* ── Element Accessors ──────────────────────────────── */

  _getElement(id) {
    return this.shadowRoot.getElementById(id);
  }

  get _launchBtn() { return this._getElement('launch-btn'); }
  get _statusEl() { return this._getElement('status'); }
  get _resultEl() { return this._getElement('result'); }
  get _progressBar() { return this._getElement('progress-bar'); }

  /* ── Validation ─────────────────────────────────────── */

  _validateSingleParameter(param, value) {
    const error = ParameterValidator.validateParameter(param, value);
    const input = this.shadowRoot.getElementById(`param-${param}`);

    if (error) {
      input.style.borderColor = '#f87171';
      input.title = error;
    } else {
      input.style.borderColor = '#4f8ef7';
      input.title = '';
    }
  }

  _validateAllParameters() {
    return ParameterValidator.validate(this.parameters);
  }

  /* ── UI State Management ────────────────────────────── */

  _setLoading(isLoading) {
    this._launchBtn.disabled = isLoading;

    if (isLoading) {
      this._progressBar.classList.add('visible');
      this._resultEl.classList.remove('visible');
      this._statusEl.innerHTML = '';
      this._resultEl.textContent = '';
    } else {
      this._progressBar.classList.remove('visible');
    }
  }

  _showValidationErrors(errors) {
    this._statusEl.innerHTML = ErrorHandler.formatValidationErrors(errors);
  }

  _showError(errorDetails) {
    this._statusEl.innerHTML = ErrorHandler.formatError(errorDetails);
    console.error('[SimulationLauncher] Error:', errorDetails);
  }

  _showSuccess(data) {
    this._statusEl.innerHTML = `
      <span class="badge badge-success">${data.status || 'SUBMITTED'}</span>
      &nbsp; Job ID: <strong>${data.jobId || 'N/A'}</strong>
    `;
    this._resultEl.textContent = JSON.stringify(data, null, 2);
    this._resultEl.classList.add('visible');
    console.log('[SimulationLauncher] Success:', data);
  }

  /**
   * Emit analytics event
   */
  _emitAnalyticsEvent(jobData, success) {
    const endTime = performance.now();
    const startTime = this._requestStartTime || endTime;
    const responseTime = Math.round(endTime - startTime);

    // Use EventBus if available (new architecture)
    if (window.eventBus) {
      window.eventBus.emit('simulation:submitted', {
        jobData,
        responseTime,
        success
      });
    } else {
      // Fallback to CustomEvent for backward compatibility
      const event = new CustomEvent('simulation-submitted', {
        bubbles: true,
        composed: true,
        detail: {
          jobData,
          responseTime,
          success
        }
      });
      document.dispatchEvent(event);
    }
  }

  /**
   * Business Logic
   */
  async _handleLaunch() {
    this._requestStartTime = performance.now();
    this._setLoading(true);

    try {
      // Step 1: Validate inputs
      await this._validateInputs();

      // Step 2: Prepare payload
      const payload = this._preparePayload();

      // Step 3: Submit request
      const response = await this._submitRequest(payload);

      // Step 4: Handle success
      await this._handleSuccess(response);

    } catch (error) {
      await this._handleError(error);
    } finally {
      this._setLoading(false);
    }
  }

  async _validateInputs() {
    this.progressManager.updateStage('VALIDATING');

    const errors = this._validateAllParameters();
    if (errors.length > 0) {
      this.progressManager.updateStage('FAILED');
      this._showValidationErrors(errors);
      throw { isValidation: true }; // Skip further processing
    }
  }

  _preparePayload() {
    this.progressManager.updateStage('INITIALIZING');

    return {
      systemId: this.getAttribute('system-id') || 'SYS-001',
      requestedAt: new Date().toISOString(),
      parameters: {
        p1: parseFloat(this.parameters.p1),
        q1: parseFloat(this.parameters.q1),
        r1: parseFloat(this.parameters.r1)
      }
    };
  }

  async _submitRequest(payload) {
    this.progressManager.updateStage('SENDING');
    await this._sleep(300);

    try {
      const response = await this.apiClient.submitSimulation(payload);

      this.progressManager.updateStage('PROCESSING');
      await this._sleep(400);

      return response;

    } catch (error) {
      // Attach response for error handling
      if (error.response) {
        error.httpResponse = error.response;
      }
      throw error;
    }
  }

  async _handleSuccess(data) {
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response structure');
    }

    this.progressManager.updateStage('COMPLETE');
    await this._sleep(300);

    this._showSuccess(data);

    // Emit success event for analytics
    this._emitAnalyticsEvent(data, true);
  }

  async _handleError(error) {
    // Skip if validation error (already displayed)
    if (error.isValidation) {
      return;
    }

    this.progressManager.updateStage('FAILED');

    // Emit error event for analytics
    this._emitAnalyticsEvent({ error: error.message || 'Unknown error' }, false);

    // Get error details
    let errorDetails;
    if (error.httpResponse) {
      // Try to parse error body
      try {
        const errorBody = await error.httpResponse.json();
        errorDetails = ErrorHandler.getErrorDetails(
          new Error(errorBody.message || error.message),
          error.httpResponse
        );
        errorDetails.technical += `\n\nResponse Body:\n${JSON.stringify(errorBody, null, 2)}`;
      } catch (e) {
        errorDetails = ErrorHandler.getErrorDetails(error, error.httpResponse);
      }
    } else {
      errorDetails = ErrorHandler.getErrorDetails(error);
    }

    this._showError(errorDetails);
  }

  /* ── Utility Methods ────────────────────────────────── */

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ── Public API ─────────────────────────────────────── */

  /**
   * Programmatically launch simulation
   * @public
   */
  launch() {
    return this._handleLaunch();
  }

  /**
   * Get current parameter values
   * @public
   */
  getParameters() {
    return { ...this.parameters };
  }

  /**
   * Set parameter values
   * @public
   */
  setParameters(params) {
    Object.assign(this.parameters, params);

    // Update UI
    Object.keys(params).forEach(key => {
      const input = this.shadowRoot.getElementById(`param-${key}`);
      if (input) {
        input.value = params[key];
      }
    });
  }

  /**
   * Reset to default values
   * @public
   */
  reset() {
    this.setParameters({
      p1: '10.5',
      q1: '25.0',
      r1: '3.14'
    });
    this._statusEl.innerHTML = '';
    this._resultEl.textContent = '';
    this._resultEl.classList.remove('visible');
    this.progressManager.reset();
  }
}

// Register custom element
customElements.define('simulation-launcher', SimulationLauncher);

export default SimulationLauncher;

