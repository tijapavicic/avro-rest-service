/**
 * HTML Template Module
 * Generates the component's HTML structure
 */

export class HtmlTemplate {
  /**
   * Generate complete template
   * @param {Object} parameters - Initial parameter values
   * @returns {string} HTML template string
   */
  static generate(parameters) {
    return `
      <div class="card">
        ${this.parameterSection(parameters)}
        ${this.progressSection()}
        ${this.buttonSection()}
        ${this.statusSection()}
        ${this.resultSection()}
      </div>
    `;
  }

  /**
   * Generate parameter table section
   * @private
   */
  static parameterSection(parameters) {
    return `
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
            ${this.parameterRow('p1', parameters.p1, 'Primary coefficient')}
            ${this.parameterRow('q1', parameters.q1, 'Quality factor')}
            ${this.parameterRow('r1', parameters.r1, 'Rate constant')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate single parameter row
   * @private
   */
  static parameterRow(name, value, description) {
    const step = name === 'r1' ? '0.01' : '0.1';
    return `
      <tr>
        <td><span class="param-name">${name}</span></td>
        <td>
          <input
            type="number"
            step="${step}"
            id="param-${name}"
            class="param-input"
            value="${value}"
          />
        </td>
        <td style="color: #94a3b8; font-size: 0.85rem;">${description}</td>
      </tr>
    `;
  }

  /**
   * Generate progress bar section
   * @private
   */
  static progressSection() {
    return `
      <div class="progress-section">
        <div id="progress-bar" class="progress-bar">
          <div id="progress-fill" class="progress-fill"></div>
          <div id="progress-text" class="progress-text">0%</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate button section
   * @private
   */
  static buttonSection() {
    return `
      <div class="button-group">
        <button id="launch-btn">🚀 Launch Simulation</button>
      </div>
    `;
  }

  /**
   * Generate status section
   * @private
   */
  static statusSection() {
    return `<div id="status"></div>`;
  }

  /**
   * Generate result section
   * @private
   */
  static resultSection() {
    return `<pre id="result"></pre>`;
  }
}

