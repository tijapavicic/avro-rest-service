/**
 * Input Validation Module
 * Validates simulation parameters before submission
 */

export class ParameterValidator {
  /**
   * Validation rules for each parameter
   */
  static RULES = {
    p1: { min: 0, max: 1000, name: 'Primary coefficient' },
    q1: { min: 0, max: 1000, name: 'Quality factor' },
    r1: { min: 0, max: 100, name: 'Rate constant' }
  };

  /**
   * Validate all parameters
   * @param {Object} parameters - Object containing p1, q1, r1
   * @returns {Array<string>} Array of error messages (empty if valid)
   */
  static validate(parameters) {
    const errors = [];

    Object.keys(this.RULES).forEach(param => {
      const rule = this.RULES[param];
      const value = parseFloat(parameters[param]);

      if (isNaN(value)) {
        errors.push(`${param} must be a valid number`);
      } else if (value < rule.min || value > rule.max) {
        errors.push(`${param} must be between ${rule.min} and ${rule.max}`);
      }
    });

    return errors;
  }

  /**
   * Validate a single parameter
   * @param {string} param - Parameter name (p1, q1, r1)
   * @param {any} value - Parameter value
   * @returns {string|null} Error message or null if valid
   */
  static validateParameter(param, value) {
    const rule = this.RULES[param];
    if (!rule) {
      return `Unknown parameter: ${param}`;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return `${param} must be a valid number`;
    }
    if (numValue < rule.min || numValue > rule.max) {
      return `${param} must be between ${rule.min} and ${rule.max}`;
    }

    return null;
  }

  /**
   * Get validation rule for a parameter
   * @param {string} param - Parameter name
   * @returns {Object|null} Rule object or null
   */
  static getRule(param) {
    return this.RULES[param] || null;
  }
}

