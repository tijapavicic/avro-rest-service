/**
 * Comprehensive Unit Tests - Validators Module
 *
 * Tests for ParameterValidator with edge cases, boundary conditions,
 * and comprehensive validation scenarios.
 */

import { ParameterValidator } from '../components/simulation-launcher/utils/validators.js';

describe('ParameterValidator', () => {

  describe('validate() - Complete validation', () => {

    test('should pass with all valid parameters', () => {
      const params = { p1: '10.5', q1: '25.0', r1: '3.14' };
      const errors = ParameterValidator.validate(params);
      expect(errors).toEqual([]);
    });

    test('should pass with boundary values', () => {
      const params = { p1: '0', q1: '0', r1: '0' };
      const errors = ParameterValidator.validate(params);
      expect(errors).toEqual([]);
    });

    test('should pass with max values', () => {
      const params = { p1: '1000', q1: '100', r1: '50' };
      const errors = ParameterValidator.validate(params);
      expect(errors).toEqual([]);
    });

    test('should fail with p1 out of range (negative)', () => {
      const params = { p1: '-5', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('p1');
    });

    test('should fail with p1 out of range (too high)', () => {
      const params = { p1: '1001', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('p1');
    });

    test('should fail with q1 out of range', () => {
      const params = { p1: '10', q1: '150', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('q1');
    });

    test('should fail with r1 out of range', () => {
      const params = { p1: '10', q1: '25', r1: '100' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('r1');
    });

    test('should fail with non-numeric values', () => {
      const params = { p1: 'abc', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('p1');
    });

    test('should fail with empty string', () => {
      const params = { p1: '', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should fail with whitespace only', () => {
      const params = { p1: '   ', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should collect multiple errors', () => {
      const params = { p1: '2000', q1: '200', r1: '100' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBe(3);
    });

    test('should handle decimal values correctly', () => {
      const params = { p1: '10.5', q1: '25.75', r1: '3.14159' };
      const errors = ParameterValidator.validate(params);
      expect(errors).toEqual([]);
    });

    test('should handle scientific notation', () => {
      const params = { p1: '1e2', q1: '2.5e1', r1: '3.14e0' };
      const errors = ParameterValidator.validate(params);
      expect(errors).toEqual([]);
    });
  });

  describe('validateParameter() - Single parameter validation', () => {

    test('should return null for valid p1', () => {
      const error = ParameterValidator.validateParameter('p1', '500');
      expect(error).toBeNull();
    });

    test('should return error message for invalid p1', () => {
      const error = ParameterValidator.validateParameter('p1', '1500');
      expect(error).toBeTruthy();
      expect(error).toContain('p1');
    });

    test('should return null for valid q1', () => {
      const error = ParameterValidator.validateParameter('q1', '50');
      expect(error).toBeNull();
    });

    test('should return error for NaN value', () => {
      const error = ParameterValidator.validateParameter('p1', 'not-a-number');
      expect(error).toBeTruthy();
    });

    test('should handle unknown parameter names gracefully', () => {
      const error = ParameterValidator.validateParameter('unknown', '10');
      expect(error).toBeTruthy();
    });
  });

  describe('getRule() - Rule retrieval', () => {

    test('should return rule for p1', () => {
      const rule = ParameterValidator.getRule('p1');
      expect(rule).toBeDefined();
      expect(rule.min).toBe(0);
      expect(rule.max).toBe(1000);
      expect(rule.label).toBeDefined();
    });

    test('should return rule for q1', () => {
      const rule = ParameterValidator.getRule('q1');
      expect(rule).toBeDefined();
      expect(rule.min).toBe(0);
      expect(rule.max).toBe(100);
    });

    test('should return rule for r1', () => {
      const rule = ParameterValidator.getRule('r1');
      expect(rule).toBeDefined();
      expect(rule.min).toBe(0);
      expect(rule.max).toBe(50);
    });

    test('should return null for unknown parameter', () => {
      const rule = ParameterValidator.getRule('unknown');
      expect(rule).toBeNull();
    });
  });

  describe('Edge Cases and Security', () => {

    test('should handle null parameters object', () => {
      expect(() => ParameterValidator.validate(null)).not.toThrow();
    });

    test('should handle undefined parameters object', () => {
      expect(() => ParameterValidator.validate(undefined)).not.toThrow();
    });

    test('should handle extra parameters gracefully', () => {
      const params = { p1: '10', q1: '25', r1: '3', extra: '999' };
      const errors = ParameterValidator.validate(params);
      // Should ignore extra parameters
      expect(errors).toEqual([]);
    });

    test('should handle very large numbers', () => {
      const params = { p1: '999999999999', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should handle very small numbers', () => {
      const params = { p1: '0.000001', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors).toEqual([]);
    });

    test('should handle Infinity', () => {
      const params = { p1: 'Infinity', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should handle negative zero', () => {
      const params = { p1: '-0', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors).toEqual([]);
    });

    test('should reject special characters', () => {
      const params = { p1: '10<script>', q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should reject SQL injection attempts', () => {
      const params = { p1: "10'; DROP TABLE users--", q1: '25', r1: '3' };
      const errors = ParameterValidator.validate(params);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {

    test('should validate 1000 parameter sets quickly', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        ParameterValidator.validate({
          p1: String(Math.random() * 1000),
          q1: String(Math.random() * 100),
          r1: String(Math.random() * 50)
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});

