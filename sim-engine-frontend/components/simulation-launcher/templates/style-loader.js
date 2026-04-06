/**
 * Style Loader Module
 * Loads and combines all CSS files
 */

export class StyleLoader {
  /**
   * CSS file paths relative to the component
   */
  static CSS_FILES = [
    'styles/main.css',
    'styles/parameters.css',
    'styles/progress.css',
    'styles/buttons.css',
    'styles/status.css',
    'styles/badges.css'
  ];

  /**
   * Load all CSS files and combine them
   * @param {string} basePath - Base path to the component directory
   * @returns {Promise<string>} Combined CSS content
   */
  static async loadStyles(basePath) {
    const promises = this.CSS_FILES.map(file =>
      fetch(`${basePath}/${file}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${file}: ${response.statusText}`);
          }
          return response.text();
        })
    );

    const styles = await Promise.all(promises);
    return styles.join('\n\n');
  }

  /**
   * Load styles synchronously (inline styles)
   * Use this for immediate rendering with inline CSS
   * @returns {string} Inline CSS styles
   */
  static getInlineStyles() {
    // This is a fallback for browsers that don't support fetch in constructable stylesheets
    // or when you need immediate rendering
    return `
      /* Combined inline styles - generated from separate CSS files */
      ${this.getMainStyles()}
      ${this.getParameterStyles()}
      ${this.getProgressStyles()}
      ${this.getButtonStyles()}
      ${this.getStatusStyles()}
      ${this.getBadgeStyles()}
    `;
  }

  /**
   * Individual style getters for inline fallback
   * @private
   */
  static getMainStyles() {
    return `
      :host { display: block; font-family: 'Segoe UI', system-ui, sans-serif; }
      .card { background: #1a1d27; border: 1px solid #2e3347; border-radius: 12px; padding: 2rem 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    `;
  }

  static getParameterStyles() {
    return `
      .params-section { width: 100%; }
      .params-section h3 { font-size: 0.95rem; color: #B4D7E8; margin-bottom: 1rem; font-weight: 600; text-align: left; }
      .params-table { width: 100%; border-collapse: collapse; background: #0f1117; border: 1px solid #2e3347; border-radius: 8px; overflow: hidden; }
      .params-table th, .params-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #2e3347; }
      .params-table thead { background: #1a1d27; }
      .params-table th { font-size: 0.8rem; font-weight: 600; color: #B4D7E8; text-transform: uppercase; letter-spacing: 0.05em; }
      .params-table tbody tr:last-child td { border-bottom: none; }
      .params-table tbody tr:hover { background: #1a1d27; }
      .param-name { color: #E0BBE4; font-weight: 600; font-family: monospace; }
      .param-input { background: #0f1117; border: 1px solid #4f8ef7; border-radius: 6px; color: #e2e8f0; padding: 0.5rem 0.75rem; font-size: 0.9rem; font-family: monospace; width: 100%; max-width: 150px; transition: border-color 0.2s, box-shadow 0.2s; }
      .param-input:focus { outline: none; border-color: #6aa3ff; box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.1); }
      .param-input:hover:not(:focus) { border-color: #6aa3ff; }
    `;
  }

  static getProgressStyles() {
    return `
      .progress-section { width: 100%; }
      .progress-bar { width: 100%; height: 32px; background: #0f1117; border: 1px solid #2e3347; border-radius: 8px; overflow: hidden; position: relative; display: none; }
      .progress-bar.visible { display: block; }
      .progress-fill { height: 100%; width: 0%; background: #4f8ef7; transition: width 0.3s ease, background 0.3s ease; display: flex; align-items: center; justify-content: center; position: relative; }
      .progress-text { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 0.8rem; font-weight: 600; color: #e2e8f0; text-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index: 1; }
    `;
  }

  static getButtonStyles() {
    return `
      .button-group { display: flex; justify-content: center; gap: 1rem; }
      button { cursor: pointer; background: #4f8ef7; color: #fff; border: none; border-radius: 8px; padding: 0.75rem 2.5rem; font-size: 1rem; font-weight: 600; letter-spacing: 0.03em; transition: background 0.18s, transform 0.1s; min-width: 200px; }
      button:hover:not(:disabled) { background: #6aa3ff; transform: translateY(-1px); }
      button:active:not(:disabled) { transform: translateY(0); }
      button:disabled { opacity: 0.55; cursor: not-allowed; }
    `;
  }

  static getStatusStyles() {
    return `
      #status { font-size: 0.85rem; color: #94a3b8; min-height: 1.2em; text-align: center; }
      #result { background: #0f1117; border: 1px solid #2e3347; border-radius: 8px; padding: 1rem 1.25rem; font-size: 0.82rem; font-family: monospace; color: #e2e8f0; width: 100%; white-space: pre-wrap; word-break: break-all; display: none; max-height: 300px; overflow-y: auto; }
      #result.visible { display: block; }
    `;
  }

  static getBadgeStyles() {
    return `
      .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
      .badge-submitted { background: #1e3a5f; color: #4f8ef7; }
      .badge-processing { background: #3b2f1f; color: #FFD8B8; }
      .badge-success { background: #1f3b2f; color: #C1E1C1; }
      .badge-error { background: #3b1f1f; color: #f87171; }
    `;
  }
}

