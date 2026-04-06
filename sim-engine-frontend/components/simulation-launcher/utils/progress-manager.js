/**
 * Progress Manager Module
 * Handles progress bar updates and state management
 */

export class ProgressManager {
  /**
   * Progress stages
   */
  static STAGES = {
    VALIDATING: { percent: 0, message: 'Validating...' },
    INITIALIZING: { percent: 10, message: 'Initializing...' },
    SENDING: { percent: 20, message: 'Sending request...' },
    PROCESSING: { percent: 50, message: 'Processing...' },
    COMPLETE: { percent: 100, message: 'Complete!' },
    FAILED: { percent: 0, message: 'Failed' }
  };

  /**
   * Color thresholds for progress bar
   */
  static COLORS = {
    LOW: '#4f8ef7',      // Blue (0-33%)
    MEDIUM: '#FFD8B8',   // Pastel Peach (34-66%)
    HIGH: '#C1E1C1'      // Pastel Green (67-100%)
  };

  constructor(fillElement, textElement) {
    this.fillElement = fillElement;
    this.textElement = textElement;
    this.currentPercent = 0;
  }

  /**
   * Update progress bar
   * @param {number} percent - Progress percentage (0-100)
   * @param {string} message - Optional message to display
   */
  update(percent, message = '') {
    this.currentPercent = Math.min(100, Math.max(0, percent));

    if (this.fillElement) {
      this.fillElement.style.width = `${this.currentPercent}%`;
      this.fillElement.style.background = this._getColor(this.currentPercent);
    }

    if (this.textElement) {
      this.textElement.textContent = message || `${this.currentPercent}%`;
    }
  }

  /**
   * Update to a predefined stage
   * @param {string} stageName - Stage name from STAGES
   */
  updateStage(stageName) {
    const stage = ProgressManager.STAGES[stageName];
    if (stage) {
      this.update(stage.percent, stage.message);
    }
  }

  /**
   * Reset progress bar
   */
  reset() {
    this.update(0, '');
  }

  /**
   * Get color based on progress percentage
   * @private
   */
  _getColor(percent) {
    if (percent < 33) {
      return ProgressManager.COLORS.LOW;
    } else if (percent < 67) {
      return ProgressManager.COLORS.MEDIUM;
    } else {
      return ProgressManager.COLORS.HIGH;
    }
  }

  /**
   * Get current progress
   * @returns {number} Current progress percentage
   */
  getProgress() {
    return this.currentPercent;
  }
}

