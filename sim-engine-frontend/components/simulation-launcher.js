/**
 * <simulation-launcher> Web Component
 *
 * Attributes:
 *   backend-url  – full URL of POST /api/simulations  (default: http://localhost:8082/api/simulations)
 *   system-id    – systemId sent in the request body  (default: SYS-001)
 *
 * Features:
 *   - Editable parameter table (p1, q1, r1)
 *   - Progress bar with status tracking
 *   - Enhanced UI with pastel colors
 *
 * Usage:
 *   <simulation-launcher backend-url="http://localhost:8082/api/simulations"></simulation-launcher>
 */
class SimulationLauncher extends HTMLElement {

  constructor() {
    super();
    // Default parameter values
    this.parameters = {
      p1: '10.5',
      q1: '25.0',
      r1: '3.14'
    };
    this.progress = 0;
  }

  /* ── Lifecycle ──────────────────────────────────────── */

  connectedCallback() {
    this._render();
    this._attachEventListeners();
  }

  /* ── Private helpers ────────────────────────────────── */

  _backendUrl() {
    return this.getAttribute('backend-url') || 'http://localhost:8082/api/simulations';
  }

  _systemId() {
    return this.getAttribute('system-id') || 'SYS-001';
  }

  _btn()    { return this.shadowRoot.getElementById('launch-btn'); }
  _status() { return this.shadowRoot.getElementById('status'); }
  _result() { return this.shadowRoot.getElementById('result'); }
  _progressBar() { return this.shadowRoot.getElementById('progress-bar'); }
  _progressFill() { return this.shadowRoot.getElementById('progress-fill'); }
  _progressText() { return this.shadowRoot.getElementById('progress-text'); }

  _attachEventListeners() {
    this._btn().addEventListener('click', () => this._launch());

    // Update parameters when inputs change
    ['p1', 'q1', 'r1'].forEach(param => {
      const input = this.shadowRoot.getElementById(`param-${param}`);
      input.addEventListener('input', (e) => {
        this.parameters[param] = e.target.value;
      });
    });
  }

  _updateProgress(percent, message = '') {
    this.progress = Math.min(100, Math.max(0, percent));
    const fill = this._progressFill();
    const text = this._progressText();

    fill.style.width = `${this.progress}%`;
    text.textContent = message || `${this.progress}%`;

    // Color based on progress
    if (this.progress < 33) {
      fill.style.background = '#4f8ef7'; // Blue
    } else if (this.progress < 66) {
      fill.style.background = '#FFD8B8'; // Pastel Peach
    } else {
      fill.style.background = '#C1E1C1'; // Pastel Green
    }
  }

  /* ── Template ───────────────────────────────────────── */

  _render() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .card {
          background: #1a1d27;
          border: 1px solid #2e3347;
          border-radius: 12px;
          padding: 2rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Parameter Table */
        .params-section {
          width: 100%;
        }
        .params-section h3 {
          font-size: 0.95rem;
          color: #B4D7E8;
          margin-bottom: 1rem;
          font-weight: 600;
          text-align: left;
        }
        .params-table {
          width: 100%;
          border-collapse: collapse;
          background: #0f1117;
          border: 1px solid #2e3347;
          border-radius: 8px;
          overflow: hidden;
        }
        .params-table th,
        .params-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid #2e3347;
        }
        .params-table thead {
          background: #1a1d27;
        }
        .params-table th {
          font-size: 0.8rem;
          font-weight: 600;
          color: #B4D7E8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .params-table tbody tr:last-child td {
          border-bottom: none;
        }
        .params-table tbody tr:hover {
          background: #1a1d27;
        }
        .param-name {
          color: #E0BBE4;
          font-weight: 600;
          font-family: monospace;
        }
        .param-input {
          background: #0f1117;
          border: 1px solid #4f8ef7;
          border-radius: 6px;
          color: #e2e8f0;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          font-family: monospace;
          width: 100%;
          max-width: 150px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .param-input:focus {
          outline: none;
          border-color: #6aa3ff;
          box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.1);
        }
        .param-input:hover:not(:focus) {
          border-color: #6aa3ff;
        }

        /* Progress Bar */
        .progress-section {
          width: 100%;
        }
        .progress-bar {
          width: 100%;
          height: 32px;
          background: #0f1117;
          border: 1px solid #2e3347;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          display: none;
        }
        .progress-bar.visible {
          display: block;
        }
        .progress-fill {
          height: 100%;
          width: 0%;
          background: #4f8ef7;
          transition: width 0.3s ease, background 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .progress-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.8rem;
          font-weight: 600;
          color: #e2e8f0;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          z-index: 1;
        }

        /* Button */
        .button-group {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        button {
          cursor: pointer;
          background: #4f8ef7;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 2.5rem;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          transition: background 0.18s, transform 0.1s;
          min-width: 200px;
        }
        button:hover:not(:disabled) {
          background: #6aa3ff;
          transform: translateY(-1px);
        }
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Status */
        #status {
          font-size: 0.85rem;
          color: #94a3b8;
          min-height: 1.2em;
          text-align: center;
        }

        /* Result */
        #result {
          background: #0f1117;
          border: 1px solid #2e3347;
          border-radius: 8px;
          padding: 1rem 1.25rem;
          font-size: 0.82rem;
          font-family: monospace;
          color: #e2e8f0;
          width: 100%;
          white-space: pre-wrap;
          word-break: break-all;
          display: none;
          max-height: 300px;
          overflow-y: auto;
        }
        #result.visible {
          display: block;
        }

        /* Badges */
        .badge {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .badge-submitted { background: #1e3a5f; color: #4f8ef7; }
        .badge-processing { background: #3b2f1f; color: #FFD8B8; }
        .badge-success { background: #1f3b2f; color: #C1E1C1; }
        .badge-error { background: #3b1f1f; color: #f87171; }
      </style>

      <div class="card">
        <!-- Parameter Table -->
        <div class="params-section">
          <h3>📊 Simulation Parameters</h3>
          <table class="params-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="param-name">p1</span></td>
                <td><input type="number" step="0.1" id="param-p1" class="param-input" value="${this.parameters.p1}" /></td>
                <td style="color: #94a3b8; font-size: 0.85rem;">Primary coefficient</td>
              </tr>
              <tr>
                <td><span class="param-name">q1</span></td>
                <td><input type="number" step="0.1" id="param-q1" class="param-input" value="${this.parameters.q1}" /></td>
                <td style="color: #94a3b8; font-size: 0.85rem;">Quality factor</td>
              </tr>
              <tr>
                <td><span class="param-name">r1</span></td>
                <td><input type="number" step="0.01" id="param-r1" class="param-input" value="${this.parameters.r1}" /></td>
                <td style="color: #94a3b8; font-size: 0.85rem;">Rate constant</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div id="progress-bar" class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
            <div id="progress-text" class="progress-text">0%</div>
          </div>
        </div>

        <!-- Launch Button -->
        <div class="button-group">
          <button id="launch-btn">🚀 Launch Simulation</button>
        </div>

        <!-- Status -->
        <div id="status"></div>

        <!-- Result -->
        <pre id="result"></pre>
      </div>
    `;
  }

  /* ── Validation ─────────────────────────────────────── */

  _validateParameters() {
    const errors = [];

    // Validate p1
    const p1 = parseFloat(this.parameters.p1);
    if (isNaN(p1)) {
      errors.push('p1 must be a valid number');
    } else if (p1 < 0 || p1 > 1000) {
      errors.push('p1 must be between 0 and 1000');
    }

    // Validate q1
    const q1 = parseFloat(this.parameters.q1);
    if (isNaN(q1)) {
      errors.push('q1 must be a valid number');
    } else if (q1 < 0 || q1 > 1000) {
      errors.push('q1 must be between 0 and 1000');
    }

    // Validate r1
    const r1 = parseFloat(this.parameters.r1);
    if (isNaN(r1)) {
      errors.push('r1 must be a valid number');
    } else if (r1 < 0 || r1 > 100) {
      errors.push('r1 must be between 0 and 100');
    }

    return errors;
  }

  _showValidationErrors(errors) {
    const status = this._status();
    status.innerHTML = `
      <span class="badge badge-error">VALIDATION ERROR</span>
      <div style="margin-top: 0.5rem; text-align: left;">
        <ul style="margin: 0; padding-left: 1.5rem; color: #f87171;">
          ${errors.map(err => `<li>${err}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  /* ── Error Handling ─────────────────────────────────── */

  _getErrorDetails(error, response = null) {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        title: 'Network Error',
        message: 'Unable to connect to the backend service',
        suggestion: 'Check if the backend is running and the URL is correct',
        technical: error.message
      };
    }

    // Timeout errors
    if (error.name === 'AbortError') {
      return {
        type: 'TIMEOUT',
        title: 'Request Timeout',
        message: 'The request took too long to complete',
        suggestion: 'The backend may be overloaded. Please try again',
        technical: 'Request exceeded 30 second timeout'
      };
    }

    // HTTP errors
    if (response) {
      const statusCode = response.status;

      if (statusCode === 400) {
        return {
          type: 'BAD_REQUEST',
          title: 'Invalid Request',
          message: 'The server rejected the request parameters',
          suggestion: 'Check parameter values and try again',
          technical: `HTTP ${statusCode}: ${response.statusText}`
        };
      }

      if (statusCode === 401 || statusCode === 403) {
        return {
          type: 'AUTH_ERROR',
          title: 'Authentication Error',
          message: 'You are not authorized to perform this action',
          suggestion: 'Please check your credentials or contact support',
          technical: `HTTP ${statusCode}: ${response.statusText}`
        };
      }

      if (statusCode === 404) {
        return {
          type: 'NOT_FOUND',
          title: 'Endpoint Not Found',
          message: 'The simulation API endpoint was not found',
          suggestion: 'Verify the backend-url attribute is correct',
          technical: `HTTP ${statusCode}: ${response.statusText}`
        };
      }

      if (statusCode === 429) {
        return {
          type: 'RATE_LIMIT',
          title: 'Too Many Requests',
          message: 'Rate limit exceeded',
          suggestion: 'Please wait a moment before trying again',
          technical: `HTTP ${statusCode}: ${response.statusText}`
        };
      }

      if (statusCode >= 500) {
        return {
          type: 'SERVER_ERROR',
          title: 'Server Error',
          message: 'The backend service encountered an error',
          suggestion: 'The issue is on the server side. Please try again later',
          technical: `HTTP ${statusCode}: ${response.statusText}`
        };
      }
    }

    // JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        type: 'PARSE_ERROR',
        title: 'Invalid Response',
        message: 'The server returned an invalid response',
        suggestion: 'The backend may be misconfigured. Contact support',
        technical: error.message
      };
    }

    // Generic error
    return {
      type: 'UNKNOWN_ERROR',
      title: 'Unexpected Error',
      message: error.message || 'An unknown error occurred',
      suggestion: 'Please try again or contact support if the issue persists',
      technical: error.stack || error.toString()
    };
  }

  _showError(errorDetails) {
    const status = this._status();

    status.innerHTML = `
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

  /* ── Core action ────────────────────────────────────── */

  async _launch() {
    const btn    = this._btn();
    const status = this._status();
    const result = this._result();
    const progressBar = this._progressBar();

    btn.disabled   = true;
    result.classList.remove('visible');
    result.textContent = '';
    status.innerHTML = '';
    progressBar.classList.add('visible');

    // Step 1: Validate inputs
    this._updateProgress(0, 'Validating...');
    const validationErrors = this._validateParameters();

    if (validationErrors.length > 0) {
      this._updateProgress(0, 'Validation Failed');
      this._showValidationErrors(validationErrors);
      progressBar.classList.remove('visible');
      btn.disabled = false;
      return;
    }

    // Step 2: Prepare payload
    this._updateProgress(10, 'Initializing...');
    status.innerHTML = '<span>Preparing simulation request…</span>';

    const payload = {
      systemId:    this._systemId(),
      requestedAt: new Date().toISOString(),
      parameters: {
        p1: parseFloat(this.parameters.p1),
        q1: parseFloat(this.parameters.q1),
        r1: parseFloat(this.parameters.r1)
      }
    };

    let response = null;

    try {
      // Step 3: Send request with timeout
      await this._sleep(300);
      this._updateProgress(20, 'Sending request...');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        response = await fetch(this._backendUrl(), {
          method:  'POST',
          headers: {
            'Content-Type':    'application/json',
            'Accept':          'application/json',
            'X-Correlation-Id': crypto.randomUUID()
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

      // Step 4: Check response status
      this._updateProgress(50, 'Processing...');
      await this._sleep(400);

      if (!response.ok) {
        // Try to get error details from response body
        let errorBody = null;
        try {
          errorBody = await response.json();
        } catch (e) {
          // Response body is not JSON, ignore
        }

        const errorDetails = this._getErrorDetails(
          new Error(errorBody?.message || response.statusText),
          response
        );

        // Add response body details if available
        if (errorBody) {
          errorDetails.technical += `\n\nResponse Body:\n${JSON.stringify(errorBody, null, 2)}`;
        }

        throw { details: errorDetails, skipProcessing: true };
      }

      // Step 5: Parse response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const errorDetails = this._getErrorDetails(parseError);
        throw { details: errorDetails, skipProcessing: true };
      }

      // Step 6: Validate response structure
      if (!data || typeof data !== 'object') {
        const errorDetails = this._getErrorDetails(
          new Error('Response is not a valid object')
        );
        errorDetails.technical += `\n\nReceived: ${typeof data}`;
        throw { details: errorDetails, skipProcessing: true };
      }

      // Step 7: Success!
      this._updateProgress(100, 'Complete!');
      await this._sleep(300);

      status.innerHTML = `
        <span class="badge badge-success">${data.status || 'SUBMITTED'}</span>
        &nbsp; Job ID: <strong>${data.jobId || 'N/A'}</strong>
      `;
      result.textContent = JSON.stringify(data, null, 2);
      result.classList.add('visible');
      progressBar.classList.remove('visible');

      console.log('[SimulationLauncher] Success:', data);

    } catch (err) {
      // Handle errors
      this._updateProgress(0, 'Failed');

      let errorDetails;
      if (err.skipProcessing && err.details) {
        errorDetails = err.details;
      } else {
        errorDetails = this._getErrorDetails(err, response);
      }

      this._showError(errorDetails);
      progressBar.classList.remove('visible');

      // Log error for debugging
      console.error('[SimulationLauncher] Error:', errorDetails);

    } finally {
      btn.disabled = false;
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

customElements.define('simulation-launcher', SimulationLauncher);

