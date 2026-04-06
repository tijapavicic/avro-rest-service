/**
 * Integration Tests - Complete Simulation Launcher Component
 *
 * Tests the entire component workflow from user interaction
 * to API communication and UI updates.
 */

import { SimulationLauncher } from '../components/simulation-launcher/simulation-launcher.js';

describe('SimulationLauncher Integration Tests', () => {

  let container;
  let component;
  let originalFetch;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create component
    component = document.createElement('simulation-launcher');
    component.setAttribute('backend-url', 'https://api.example.com/simulations');
    component.setAttribute('system-id', 'SYS-TEST');
    container.appendChild(component);

    // Mock fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    container.remove();
    global.fetch = originalFetch;
  });

  describe('Component Initialization', () => {

    test('should render in the DOM', () => {
      expect(component).toBeDefined();
      expect(component.shadowRoot).toBeDefined();
    });

    test('should display parameter inputs', () => {
      const p1Input = component.shadowRoot.getElementById('param-p1');
      const q1Input = component.shadowRoot.getElementById('param-q1');
      const r1Input = component.shadowRoot.getElementById('param-r1');

      expect(p1Input).toBeDefined();
      expect(q1Input).toBeDefined();
      expect(r1Input).toBeDefined();
    });

    test('should display launch button', () => {
      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      expect(launchBtn).toBeDefined();
      expect(launchBtn.textContent).toContain('Launch');
    });

    test('should have initial parameter values', () => {
      const p1Input = component.shadowRoot.getElementById('param-p1');
      expect(p1Input.value).toBe('10.5');
    });
  });

  describe('User Interactions', () => {

    test('should update parameter value on input', () => {
      const p1Input = component.shadowRoot.getElementById('param-p1');

      p1Input.value = '25';
      p1Input.dispatchEvent(new Event('input'));

      expect(component.parameters.p1).toBe('25');
    });

    test('should validate on blur', () => {
      const p1Input = component.shadowRoot.getElementById('param-p1');

      p1Input.value = '2000'; // Invalid
      p1Input.dispatchEvent(new Event('blur'));

      // Border should change to error color
      expect(p1Input.style.borderColor).toBe('#f87171');
    });

    test('should clear validation error on valid input', () => {
      const p1Input = component.shadowRoot.getElementById('param-p1');

      p1Input.value = '500'; // Valid
      p1Input.dispatchEvent(new Event('blur'));

      expect(p1Input.style.borderColor).toBe('#4f8ef7');
    });
  });

  describe('Successful Submission', () => {

    test('should submit valid parameters successfully', async () => {
      const mockResponse = {
        jobId: 'JOB-123',
        status: 'SUBMITTED',
        timestamp: '2026-04-07T12:00:00Z'
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockResponse)
        })
      );

      // Set valid parameters
      component.parameters = { p1: '10', q1: '20', r1: '5' };

      // Click launch button
      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check status display
      const statusEl = component.shadowRoot.getElementById('status');
      expect(statusEl.innerHTML).toContain('SUBMITTED');
      expect(statusEl.innerHTML).toContain('JOB-123');
    });

    test('should show progress during submission', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ jobId: '456' })
          }), 100);
        })
      );

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      // Progress bar should be visible
      const progressBar = component.shadowRoot.getElementById('progress-bar');
      expect(progressBar.classList.contains('visible')).toBe(true);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    test('should disable button during submission', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ jobId: '789' })
          }), 100);
        })
      );

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      // Button should be disabled
      expect(launchBtn.disabled).toBe(true);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 150));

      // Button should be enabled again
      expect(launchBtn.disabled).toBe(false);
    });

    test('should display result in result area', async () => {
      const mockResponse = {
        jobId: 'JOB-999',
        status: 'PROCESSING',
        parameters: { p1: 10, q1: 20, r1: 5 }
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const resultEl = component.shadowRoot.getElementById('result');
      expect(resultEl.classList.contains('visible')).toBe(true);
      expect(resultEl.textContent).toContain('JOB-999');
    });
  });

  describe('Validation Errors', () => {

    test('should prevent submission with invalid parameters', async () => {
      global.fetch = jest.fn();

      // Set invalid parameters
      component.parameters = { p1: '2000', q1: '20', r1: '5' };

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      // Fetch should not be called
      expect(global.fetch).not.toHaveBeenCalled();

      // Status should show validation error
      const statusEl = component.shadowRoot.getElementById('status');
      expect(statusEl.innerHTML).toContain('VALIDATION_ERROR');
    });

    test('should display all validation errors', async () => {
      // Set multiple invalid parameters
      component.parameters = { p1: '2000', q1: '200', r1: '100' };

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      const statusEl = component.shadowRoot.getElementById('status');
      expect(statusEl.innerHTML).toContain('p1');
      expect(statusEl.innerHTML).toContain('q1');
      expect(statusEl.innerHTML).toContain('r1');
    });
  });

  describe('Network Errors', () => {

    test('should handle network failure gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new TypeError('Failed to fetch'))
      );

      component.parameters = { p1: '10', q1: '20', r1: '5' };

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const statusEl = component.shadowRoot.getElementById('status');
      expect(statusEl.innerHTML).toContain('NETWORK_ERROR');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';

      global.fetch = jest.fn(() => Promise.reject(timeoutError));

      component.parameters = { p1: '10', q1: '20', r1: '5' };

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const statusEl = component.shadowRoot.getElementById('status');
      expect(statusEl.innerHTML).toContain('TIMEOUT');
    });
  });

  describe('HTTP Error Responses', () => {

    test('should handle 400 Bad Request', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ error: 'Invalid parameters' })
        })
      );

      component.parameters = { p1: '10', q1: '20', r1: '5' };

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const statusEl = component.shadowRoot.getElementById('status');
      expect(statusEl.innerHTML).toContain('BAD_REQUEST');
    });

    test('should handle 500 Server Error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      );

      component.parameters = { p1: '10', q1: '20', r1: '5' };

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const statusEl = component.shadowRoot.getElementById('status');
      expect(statusEl.innerHTML).toContain('SERVER_ERROR');
    });
  });

  describe('Progress Updates', () => {

    test('should update progress through stages', async () => {
      let resolvePromise;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      global.fetch = jest.fn(() => fetchPromise);

      component.parameters = { p1: '10', q1: '20', r1: '5' };

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      // Check progress bar is visible
      const progressBar = component.shadowRoot.getElementById('progress-bar');
      expect(progressBar.classList.contains('visible')).toBe(true);

      // Resolve the fetch
      resolvePromise({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ jobId: 'TEST-123' })
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Progress bar should be hidden after completion
      expect(progressBar.classList.contains('visible')).toBe(false);
    });
  });

  describe('Attribute Changes', () => {

    test('should update API URL when backend-url attribute changes', () => {
      component.setAttribute('backend-url', 'https://new-api.example.com');

      expect(component.apiClient.getBaseUrl()).toBe('https://new-api.example.com');
    });

    test('should handle system-id attribute changes', () => {
      component.setAttribute('system-id', 'SYS-NEW');

      // System ID should be used in next request
      expect(component.getAttribute('system-id')).toBe('SYS-NEW');
    });
  });

  describe('Multiple Submissions', () => {

    test('should handle consecutive submissions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ jobId: 'MULTI-1' })
        })
      );

      const launchBtn = component.shadowRoot.getElementById('launch-btn');

      // First submission
      component.parameters = { p1: '10', q1: '20', r1: '5' };
      launchBtn.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second submission
      component.parameters = { p1: '15', q1: '25', r1: '7' };
      launchBtn.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have been called twice
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('should reset state between submissions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ jobId: 'RESET-TEST' })
        })
      );

      const launchBtn = component.shadowRoot.getElementById('launch-btn');

      // First submission
      launchBtn.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const statusEl = component.shadowRoot.getElementById('status');
      const firstStatus = statusEl.innerHTML;

      // Second submission
      launchBtn.click();

      // Status should be cleared during submission
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(statusEl.innerHTML).toBe('');

      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Edge Cases', () => {

    test('should handle rapid button clicks', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ jobId: 'RAPID' })
          }), 100);
        })
      );

      const launchBtn = component.shadowRoot.getElementById('launch-btn');

      // Click multiple times rapidly
      launchBtn.click();
      launchBtn.click();
      launchBtn.click();

      // Should only submit once (button is disabled)
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle component removal during request', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ jobId: 'REMOVED' })
          }), 100);
        })
      );

      const launchBtn = component.shadowRoot.getElementById('launch-btn');
      launchBtn.click();

      // Remove component mid-request
      component.remove();

      // Should not throw errors
      await new Promise(resolve => setTimeout(resolve, 150));
    });
  });
});

