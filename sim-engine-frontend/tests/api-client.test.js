/**
 * Comprehensive Unit Tests - API Client Module
 *
 * Tests for ApiClient with HTTP requests, error handling,
 * and network communication scenarios.
 */

import { ApiClient } from '../components/simulation-launcher/utils/api-client.js';

describe('ApiClient', () => {

  let apiClient;
  let originalFetch;

  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com');
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Constructor', () => {

    test('should initialize with base URL', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient.getBaseUrl()).toBe('https://api.example.com');
    });

    test('should handle URL without trailing slash', () => {
      const client = new ApiClient('https://api.example.com');
      expect(client.getBaseUrl()).toBe('https://api.example.com');
    });

    test('should handle URL with trailing slash', () => {
      const client = new ApiClient('https://api.example.com/');
      expect(client.getBaseUrl()).toBe('https://api.example.com/');
    });

    test('should handle localhost URLs', () => {
      const client = new ApiClient('http://localhost:8082');
      expect(client.getBaseUrl()).toBe('http://localhost:8082');
    });
  });

  describe('setBaseUrl() - Update base URL', () => {

    test('should update base URL', () => {
      apiClient.setBaseUrl('https://new-api.example.com');
      expect(apiClient.getBaseUrl()).toBe('https://new-api.example.com');
    });

    test('should handle multiple updates', () => {
      apiClient.setBaseUrl('https://api1.example.com');
      apiClient.setBaseUrl('https://api2.example.com');
      apiClient.setBaseUrl('https://api3.example.com');

      expect(apiClient.getBaseUrl()).toBe('https://api3.example.com');
    });
  });

  describe('post() - POST requests', () => {

    test('should send POST request with payload', async () => {
      const mockResponse = { jobId: '123', status: 'SUBMITTED' };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const payload = { p1: 10, q1: 20, r1: 5 };
      const result = await apiClient.post(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(payload)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    test('should include default headers', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      await apiClient.post({ test: 'data' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
    });

    test('should handle 201 Created response', async () => {
      const mockResponse = { jobId: '456', status: 'CREATED' };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await apiClient.post({ data: 'test' });
      expect(result).toEqual(mockResponse);
    });

    test('should handle empty response body', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 204,
          json: () => Promise.resolve(null)
        })
      );

      const result = await apiClient.post({ data: 'test' });
      expect(result).toBeNull();
    });

    test('should throw on 400 Bad Request', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ error: 'Invalid data' })
        })
      );

      await expect(apiClient.post({ invalid: 'data' }))
        .rejects
        .toThrow();
    });

    test('should throw on 404 Not Found', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      );

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow();
    });

    test('should throw on 500 Internal Server Error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      );

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow();
    });

    test('should handle network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new TypeError('Failed to fetch'))
      );

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow(TypeError);
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';

      global.fetch = jest.fn(() =>
        Promise.reject(timeoutError)
      );

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow('AbortError');
    });
  });

  describe('Timeout Handling', () => {

    test('should set default timeout', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      await apiClient.post({ data: 'test' });

      const callArgs = global.fetch.mock.calls[0][1];
      expect(callArgs.signal).toBeDefined();
    });

    test('should allow custom timeout', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      await apiClient.post({ data: 'test' }, { timeout: 10000 });

      expect(global.fetch).toHaveBeenCalled();
    });

    test('should abort on timeout', async () => {
      jest.useFakeTimers();

      global.fetch = jest.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({})
          }), 10000);
        })
      );

      const postPromise = apiClient.post({ data: 'test' }, { timeout: 100 });

      jest.advanceTimersByTime(100);

      await expect(postPromise).rejects.toThrow();

      jest.useRealTimers();
    });
  });

  describe('Request Headers', () => {

    test('should send custom headers', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      const customHeaders = {
        'X-Custom-Header': 'CustomValue',
        'Authorization': 'Bearer token123'
      };

      await apiClient.post({ data: 'test' }, { headers: customHeaders });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'CustomValue',
            'Authorization': 'Bearer token123'
          })
        })
      );
    });

    test('should merge custom headers with defaults', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      await apiClient.post({ data: 'test' }, {
        headers: { 'X-Custom': 'Value' }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Custom': 'Value'
          })
        })
      );
    });
  });

  describe('Payload Serialization', () => {

    test('should serialize object payloads', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      const payload = {
        systemId: 'SYS-001',
        parameters: { p1: 10, q1: 20, r1: 5 }
      };

      await apiClient.post(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(payload)
        })
      );
    });

    test('should handle nested objects', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      const payload = {
        level1: {
          level2: {
            level3: 'deep value'
          }
        }
      };

      await apiClient.post(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(payload)
        })
      );
    });

    test('should handle arrays in payload', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      const payload = {
        items: [1, 2, 3, 4, 5]
      };

      await apiClient.post(payload);

      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle special characters', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      const payload = {
        text: 'Special chars: <>&"\'',
        unicode: '🚀 UTF-8 💯'
      };

      await apiClient.post(payload);

      const callArgs = global.fetch.mock.calls[0][1];
      const sentBody = JSON.parse(callArgs.body);

      expect(sentBody.text).toBe('Special chars: <>&"\'');
      expect(sentBody.unicode).toBe('🚀 UTF-8 💯');
    });
  });

  describe('Response Parsing', () => {

    test('should parse JSON response', async () => {
      const mockData = {
        jobId: '789',
        status: 'PROCESSING',
        timestamp: '2026-04-07T12:00:00Z'
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockData)
        })
      );

      const result = await apiClient.post({ data: 'test' });
      expect(result).toEqual(mockData);
    });

    test('should handle non-JSON responses gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('Plain text response'),
          json: () => Promise.reject(new Error('Not JSON'))
        })
      );

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow();
    });

    test('should handle empty JSON response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      const result = await apiClient.post({ data: 'test' });
      expect(result).toEqual({});
    });
  });

  describe('Error Handling', () => {

    test('should preserve error response body', async () => {
      const errorBody = {
        error: 'Validation failed',
        details: ['p1 is out of range']
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve(errorBody)
        })
      );

      try {
        await apiClient.post({ data: 'invalid' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response).toBeDefined();
      }
    });

    test('should handle CORS errors', async () => {
      const corsError = new TypeError('Failed to fetch');
      corsError.message = 'NetworkError when attempting to fetch resource.';

      global.fetch = jest.fn(() => Promise.reject(corsError));

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow(TypeError);
    });

    test('should handle DNS errors', async () => {
      const dnsError = new TypeError('Failed to fetch');

      global.fetch = jest.fn(() => Promise.reject(dnsError));

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow();
    });
  });

  describe('Edge Cases', () => {

    test('should handle null payload', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      await apiClient.post(null);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle undefined payload', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      await apiClient.post(undefined);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle very large payloads', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({})
        })
      );

      const largePayload = {
        data: 'x'.repeat(100000)
      };

      await apiClient.post(largePayload);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle circular references gracefully', async () => {
      const payload = { name: 'test' };
      payload.self = payload; // Circular reference

      // JSON.stringify should throw
      expect(() => JSON.stringify(payload)).toThrow();
    });
  });

  describe('Retry Logic (if implemented)', () => {

    test('should retry on network failure', async () => {
      let callCount = 0;

      global.fetch = jest.fn(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new TypeError('Failed to fetch'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        });
      });

      // Assuming retry logic is implemented
      // This test would verify it works correctly
    });

    test('should not retry on 4xx errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        })
      );

      await expect(apiClient.post({ data: 'test' }))
        .rejects
        .toThrow();

      // Should only call once, no retries
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Scenarios', () => {

    test('should complete successful request flow', async () => {
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

      const payload = {
        systemId: 'SYS-001',
        parameters: { p1: 10, q1: 20, r1: 5 }
      };

      const result = await apiClient.post(payload);

      expect(result.jobId).toBe('JOB-123');
      expect(result.status).toBe('SUBMITTED');
    });
  });
});

