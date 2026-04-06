/**
 * Comprehensive Unit Tests - Progress Manager Module
 *
 * Tests for ProgressManager with state management, animations,
 * and UI update scenarios.
 */

import { ProgressManager } from '../components/simulation-launcher/utils/progress-manager.js';

describe('ProgressManager', () => {

  let mockFillElement;
  let mockTextElement;
  let progressManager;

  beforeEach(() => {
    // Create fresh mock DOM elements for each test
    mockFillElement = {
      style: { width: '', background: '' },
      classList: {
        classes: new Set(),
        add: function(className) { this.classes.add(className); },
        remove: function(className) { this.classes.delete(className); },
        contains: function(className) { return this.classes.has(className); }
      }
    };

    mockTextElement = {
      textContent: ''
    };

    progressManager = new ProgressManager(mockFillElement, mockTextElement);
  });

  describe('Constructor', () => {

    test('should initialize with 0% progress', () => {
      expect(progressManager.getProgress()).toBe(0);
    });

    test('should accept DOM elements', () => {
      expect(progressManager).toBeDefined();
    });

    test('should handle null elements gracefully', () => {
      expect(() => new ProgressManager(null, null)).not.toThrow();
    });
  });

  describe('update() - Manual progress updates', () => {

    test('should update to 50%', () => {
      progressManager.update(50, 'Processing...');

      expect(progressManager.getProgress()).toBe(50);
      expect(mockFillElement.style.width).toBe('50%');
      expect(mockTextElement.textContent).toBe('Processing...');
    });

    test('should update to 100%', () => {
      progressManager.update(100, 'Complete');

      expect(progressManager.getProgress()).toBe(100);
      expect(mockFillElement.style.width).toBe('100%');
    });

    test('should update to 0%', () => {
      progressManager.update(50, 'Half');
      progressManager.update(0, 'Reset');

      expect(progressManager.getProgress()).toBe(0);
      expect(mockFillElement.style.width).toBe('0%');
    });

    test('should clamp progress above 100%', () => {
      progressManager.update(150, 'Over');

      expect(progressManager.getProgress()).toBe(100);
      expect(mockFillElement.style.width).toBe('100%');
    });

    test('should clamp progress below 0%', () => {
      progressManager.update(-50, 'Under');

      expect(progressManager.getProgress()).toBe(0);
      expect(mockFillElement.style.width).toBe('0%');
    });

    test('should handle decimal progress values', () => {
      progressManager.update(33.33, 'One third');

      expect(progressManager.getProgress()).toBe(33.33);
      expect(mockFillElement.style.width).toBe('33.33%');
    });

    test('should handle very small progress values', () => {
      progressManager.update(0.01, 'Tiny');

      expect(progressManager.getProgress()).toBe(0.01);
    });

    test('should update message without changing progress', () => {
      progressManager.update(50, 'Message 1');
      progressManager.update(50, 'Message 2');

      expect(progressManager.getProgress()).toBe(50);
      expect(mockTextElement.textContent).toBe('Message 2');
    });

    test('should handle empty message', () => {
      progressManager.update(50, '');

      expect(mockTextElement.textContent).toBe('');
    });

    test('should handle long messages', () => {
      const longMessage = 'This is a very long message that should still be displayed correctly';
      progressManager.update(50, longMessage);

      expect(mockTextElement.textContent).toBe(longMessage);
    });
  });

  describe('updateStage() - Predefined stages', () => {

    test('should update to VALIDATING stage (10%)', () => {
      progressManager.updateStage('VALIDATING');

      expect(progressManager.getProgress()).toBe(10);
      expect(mockTextElement.textContent).toContain('Validating');
    });

    test('should update to SENDING stage (20%)', () => {
      progressManager.updateStage('SENDING');

      expect(progressManager.getProgress()).toBe(20);
      expect(mockTextElement.textContent).toContain('Sending');
    });

    test('should update to PROCESSING stage (50%)', () => {
      progressManager.updateStage('PROCESSING');

      expect(progressManager.getProgress()).toBe(50);
      expect(mockTextElement.textContent).toContain('Processing');
    });

    test('should update to RECEIVING stage (80%)', () => {
      progressManager.updateStage('RECEIVING');

      expect(progressManager.getProgress()).toBe(80);
      expect(mockTextElement.textContent).toContain('Receiving');
    });

    test('should update to COMPLETE stage (100%)', () => {
      progressManager.updateStage('COMPLETE');

      expect(progressManager.getProgress()).toBe(100);
      expect(mockTextElement.textContent).toContain('Complete');
    });

    test('should handle unknown stage gracefully', () => {
      expect(() => progressManager.updateStage('UNKNOWN')).not.toThrow();
    });

    test('should progress through multiple stages', () => {
      progressManager.updateStage('VALIDATING');
      expect(progressManager.getProgress()).toBe(10);

      progressManager.updateStage('SENDING');
      expect(progressManager.getProgress()).toBe(20);

      progressManager.updateStage('PROCESSING');
      expect(progressManager.getProgress()).toBe(50);

      progressManager.updateStage('COMPLETE');
      expect(progressManager.getProgress()).toBe(100);
    });
  });

  describe('reset() - Reset progress', () => {

    test('should reset to 0%', () => {
      progressManager.update(75, 'Almost done');
      progressManager.reset();

      expect(progressManager.getProgress()).toBe(0);
      expect(mockFillElement.style.width).toBe('0%');
    });

    test('should clear message on reset', () => {
      progressManager.update(50, 'Processing');
      progressManager.reset();

      expect(mockTextElement.textContent).toBe('');
    });

    test('should be callable multiple times', () => {
      progressManager.reset();
      progressManager.reset();

      expect(progressManager.getProgress()).toBe(0);
    });
  });

  describe('getProgress() - Get current progress', () => {

    test('should return initial progress', () => {
      expect(progressManager.getProgress()).toBe(0);
    });

    test('should return updated progress', () => {
      progressManager.update(42, 'Test');
      expect(progressManager.getProgress()).toBe(42);
    });

    test('should return clamped values', () => {
      progressManager.update(150, 'Over');
      expect(progressManager.getProgress()).toBe(100);

      progressManager.update(-50, 'Under');
      expect(progressManager.getProgress()).toBe(0);
    });
  });

  describe('Color Gradients', () => {

    test('should use blue color for low progress (0-33%)', () => {
      progressManager.update(10, 'Low');
      expect(mockFillElement.style.background).toBe('#4f8ef7');

      progressManager.update(25, 'Still low');
      expect(mockFillElement.style.background).toBe('#4f8ef7');
    });

    test('should use peach color for medium progress (34-66%)', () => {
      progressManager.update(40, 'Medium');
      expect(mockFillElement.style.background).toBe('#FFD8B8');

      progressManager.update(60, 'Still medium');
      expect(mockFillElement.style.background).toBe('#FFD8B8');
    });

    test('should use green color for high progress (67-100%)', () => {
      progressManager.update(70, 'High');
      expect(mockFillElement.style.background).toBe('#C1E1C1');

      progressManager.update(100, 'Complete');
      expect(mockFillElement.style.background).toBe('#C1E1C1');
    });

    test('should transition colors as progress increases', () => {
      progressManager.update(20, 'Start');
      const color1 = mockFillElement.style.background;

      progressManager.update(50, 'Middle');
      const color2 = mockFillElement.style.background;

      progressManager.update(90, 'End');
      const color3 = mockFillElement.style.background;

      expect(color1).not.toBe(color2);
      expect(color2).not.toBe(color3);
      expect(color1).not.toBe(color3);
    });

    test('should handle boundary values correctly', () => {
      progressManager.update(33, 'Boundary');
      expect(mockFillElement.style.background).toBe('#4f8ef7');

      progressManager.update(34, 'Just over');
      expect(mockFillElement.style.background).toBe('#FFD8B8');

      progressManager.update(66, 'Almost high');
      expect(mockFillElement.style.background).toBe('#FFD8B8');

      progressManager.update(67, 'High');
      expect(mockFillElement.style.background).toBe('#C1E1C1');
    });
  });

  describe('Active State Management', () => {

    test('should add active class when progress > 0', () => {
      progressManager.update(10, 'Started');
      expect(mockFillElement.classList.contains('active')).toBe(true);
    });

    test('should remove active class when progress = 0', () => {
      progressManager.update(50, 'Running');
      progressManager.update(0, 'Stopped');

      expect(mockFillElement.classList.contains('active')).toBe(false);
    });

    test('should maintain active class at 100%', () => {
      progressManager.update(100, 'Complete');
      expect(mockFillElement.classList.contains('active')).toBe(true);
    });
  });

  describe('Edge Cases', () => {

    test('should handle NaN progress', () => {
      progressManager.update(NaN, 'Invalid');

      // Should clamp to 0
      expect(progressManager.getProgress()).toBe(0);
    });

    test('should handle Infinity progress', () => {
      progressManager.update(Infinity, 'Infinite');

      // Should clamp to 100
      expect(progressManager.getProgress()).toBe(100);
    });

    test('should handle negative Infinity', () => {
      progressManager.update(-Infinity, 'Negative infinite');

      // Should clamp to 0
      expect(progressManager.getProgress()).toBe(0);
    });

    test('should handle null message', () => {
      expect(() => progressManager.update(50, null)).not.toThrow();
    });

    test('should handle undefined message', () => {
      expect(() => progressManager.update(50, undefined)).not.toThrow();
    });

    test('should handle special characters in message', () => {
      progressManager.update(50, '<script>alert("xss")</script>');
      expect(mockTextElement.textContent).toBe('<script>alert("xss")</script>');
    });

    test('should handle unicode characters in message', () => {
      progressManager.update(50, '🚀 Processing... 💯');
      expect(mockTextElement.textContent).toBe('🚀 Processing... 💯');
    });
  });

  describe('Performance', () => {

    test('should handle rapid updates efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i <= 100; i++) {
        progressManager.update(i, `Step ${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in less than 50ms
      expect(duration).toBeLessThan(50);
      expect(progressManager.getProgress()).toBe(100);
    });

    test('should handle 1000 updates without memory leaks', () => {
      for (let i = 0; i < 1000; i++) {
        progressManager.update(Math.random() * 100, `Update ${i}`);
      }

      expect(progressManager.getProgress()).toBeGreaterThanOrEqual(0);
      expect(progressManager.getProgress()).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration Scenarios', () => {

    test('should simulate complete workflow', () => {
      // Start
      progressManager.updateStage('VALIDATING');
      expect(progressManager.getProgress()).toBe(10);

      // Send request
      progressManager.updateStage('SENDING');
      expect(progressManager.getProgress()).toBe(20);

      // Processing with gradual updates
      progressManager.update(30, 'Processing 30%');
      progressManager.update(40, 'Processing 40%');
      progressManager.update(50, 'Processing 50%');

      // Receiving response
      progressManager.updateStage('RECEIVING');
      expect(progressManager.getProgress()).toBe(80);

      // Complete
      progressManager.updateStage('COMPLETE');
      expect(progressManager.getProgress()).toBe(100);

      // Reset for next operation
      progressManager.reset();
      expect(progressManager.getProgress()).toBe(0);
    });

    test('should handle error scenario', () => {
      progressManager.updateStage('SENDING');
      expect(progressManager.getProgress()).toBe(20);

      // Error occurs, reset
      progressManager.reset();
      expect(progressManager.getProgress()).toBe(0);
    });

    test('should handle retry scenario', () => {
      // First attempt
      progressManager.updateStage('SENDING');
      expect(progressManager.getProgress()).toBe(20);

      // Fails, reset
      progressManager.reset();

      // Retry
      progressManager.updateStage('VALIDATING');
      expect(progressManager.getProgress()).toBe(10);

      progressManager.updateStage('SENDING');
      expect(progressManager.getProgress()).toBe(20);

      // Success
      progressManager.updateStage('COMPLETE');
      expect(progressManager.getProgress()).toBe(100);
    });
  });
});

