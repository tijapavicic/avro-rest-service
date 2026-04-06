/**
 * Comprehensive Unit Tests - Error Handler Module
 *
 * Tests for ErrorHandler with various error types, HTTP status codes,
 * and error formatting scenarios.
 */

import { ErrorHandler } from '../components/simulation-launcher/utils/error-handler.js';

describe('ErrorHandler', () => {

  describe('getErrorDetails() - Error categorization', () => {

    describe('Network Errors', () => {

      test('should detect network error from TypeError', () => {
        const error = new TypeError('Failed to fetch');
        const details = ErrorHandler.getErrorDetails(error);

        expect(details.type).toBe('NETWORK_ERROR');
        expect(details.userMessage).toContain('network');
        expect(details.severity).toBe('high');
      });

      test('should detect network error from fetch failure', () => {
        const error = new TypeError('NetworkError when attempting to fetch resource');
        const details = ErrorHandler.getErrorDetails(error);

        expect(details.type).toBe('NETWORK_ERROR');
        expect(details.retryable).toBe(true);
      });
    });

    describe('Timeout Errors', () => {

      test('should detect timeout from AbortError', () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        const details = ErrorHandler.getErrorDetails(error);

        expect(details.type).toBe('TIMEOUT');
        expect(details.userMessage).toContain('timeout');
        expect(details.retryable).toBe(true);
      });

      test('should detect timeout from message', () => {
        const error = new Error('Request timeout after 5000ms');
        const details = ErrorHandler.getErrorDetails(error);

        expect(details.type).toBe('TIMEOUT');
      });
    });

    describe('HTTP Status Codes - Client Errors (4xx)', () => {

      test('should handle 400 Bad Request', () => {
        const response = { status: 400, statusText: 'Bad Request' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('BAD_REQUEST');
        expect(details.statusCode).toBe(400);
        expect(details.retryable).toBe(false);
      });

      test('should handle 401 Unauthorized', () => {
        const response = { status: 401, statusText: 'Unauthorized' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('UNAUTHORIZED');
        expect(details.statusCode).toBe(401);
        expect(details.userMessage).toContain('authentication');
      });

      test('should handle 403 Forbidden', () => {
        const response = { status: 403, statusText: 'Forbidden' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('FORBIDDEN');
        expect(details.statusCode).toBe(403);
        expect(details.userMessage).toContain('permission');
      });

      test('should handle 404 Not Found', () => {
        const response = { status: 404, statusText: 'Not Found' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('NOT_FOUND');
        expect(details.statusCode).toBe(404);
      });

      test('should handle 422 Unprocessable Entity', () => {
        const response = { status: 422, statusText: 'Unprocessable Entity' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('VALIDATION_ERROR');
        expect(details.statusCode).toBe(422);
      });

      test('should handle 429 Too Many Requests', () => {
        const response = { status: 429, statusText: 'Too Many Requests' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('RATE_LIMIT');
        expect(details.statusCode).toBe(429);
        expect(details.retryable).toBe(true);
        expect(details.userMessage).toContain('rate limit');
      });
    });

    describe('HTTP Status Codes - Server Errors (5xx)', () => {

      test('should handle 500 Internal Server Error', () => {
        const response = { status: 500, statusText: 'Internal Server Error' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('SERVER_ERROR');
        expect(details.statusCode).toBe(500);
        expect(details.severity).toBe('high');
        expect(details.retryable).toBe(true);
      });

      test('should handle 502 Bad Gateway', () => {
        const response = { status: 502, statusText: 'Bad Gateway' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('SERVER_ERROR');
        expect(details.statusCode).toBe(502);
      });

      test('should handle 503 Service Unavailable', () => {
        const response = { status: 503, statusText: 'Service Unavailable' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('SERVER_ERROR');
        expect(details.statusCode).toBe(503);
        expect(details.retryable).toBe(true);
      });

      test('should handle 504 Gateway Timeout', () => {
        const response = { status: 504, statusText: 'Gateway Timeout' };
        const details = ErrorHandler.getErrorDetails(new Error(), response);

        expect(details.type).toBe('SERVER_ERROR');
        expect(details.statusCode).toBe(504);
      });
    });

    describe('Unknown Errors', () => {

      test('should handle generic Error', () => {
        const error = new Error('Something went wrong');
        const details = ErrorHandler.getErrorDetails(error);

        expect(details.type).toBe('UNKNOWN');
        expect(details.technicalMessage).toContain('Something went wrong');
      });

      test('should handle error without message', () => {
        const error = new Error();
        const details = ErrorHandler.getErrorDetails(error);

        expect(details.type).toBe('UNKNOWN');
        expect(details.technicalMessage).toBeDefined();
      });

      test('should handle string errors', () => {
        const details = ErrorHandler.getErrorDetails('String error');

        expect(details.type).toBe('UNKNOWN');
      });

      test('should handle null error', () => {
        const details = ErrorHandler.getErrorDetails(null);

        expect(details).toBeDefined();
        expect(details.type).toBeDefined();
      });

      test('should handle undefined error', () => {
        const details = ErrorHandler.getErrorDetails(undefined);

        expect(details).toBeDefined();
        expect(details.type).toBeDefined();
      });
    });
  });

  describe('formatValidationErrors() - Error formatting', () => {

    test('should format single validation error', () => {
      const errors = ['p1 must be between 0 and 1000'];
      const html = ErrorHandler.formatValidationErrors(errors);

      expect(html).toContain('badge-error');
      expect(html).toContain('VALIDATION_ERROR');
      expect(html).toContain('p1 must be between 0 and 1000');
    });

    test('should format multiple validation errors', () => {
      const errors = [
        'p1 must be between 0 and 1000',
        'q1 must be between 0 and 100'
      ];
      const html = ErrorHandler.formatValidationErrors(errors);

      expect(html).toContain('VALIDATION_ERROR');
      expect(html).toContain('p1');
      expect(html).toContain('q1');
    });

    test('should handle empty errors array', () => {
      const errors = [];
      const html = ErrorHandler.formatValidationErrors(errors);

      expect(html).toBe('');
    });

    test('should escape HTML in error messages', () => {
      const errors = ['<script>alert("xss")</script>'];
      const html = ErrorHandler.formatValidationErrors(errors);

      // Should not contain raw script tags
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('should format long error messages properly', () => {
      const longError = 'This is a very long error message that should still be formatted properly without breaking the UI layout or causing any visual issues whatsoever';
      const errors = [longError];
      const html = ErrorHandler.formatValidationErrors(errors);

      expect(html).toContain('VALIDATION_ERROR');
      expect(html.length).toBeGreaterThan(0);
    });
  });

  describe('formatError() - Error details formatting', () => {

    test('should format network error', () => {
      const details = {
        type: 'NETWORK_ERROR',
        userMessage: 'Network connection failed',
        technicalMessage: 'TypeError: Failed to fetch',
        severity: 'high'
      };
      const html = ErrorHandler.formatError(details);

      expect(html).toContain('badge-error');
      expect(html).toContain('NETWORK_ERROR');
      expect(html).toContain('Network connection failed');
    });

    test('should format server error', () => {
      const details = {
        type: 'SERVER_ERROR',
        userMessage: 'Server error occurred',
        statusCode: 500,
        severity: 'high'
      };
      const html = ErrorHandler.formatError(details);

      expect(html).toContain('SERVER_ERROR');
      expect(html).toContain('500');
    });

    test('should format validation error', () => {
      const details = {
        type: 'VALIDATION_ERROR',
        userMessage: 'Invalid input provided',
        severity: 'medium'
      };
      const html = ErrorHandler.formatError(details);

      expect(html).toContain('VALIDATION_ERROR');
    });

    test('should include retry information for retryable errors', () => {
      const details = {
        type: 'TIMEOUT',
        userMessage: 'Request timed out',
        retryable: true,
        severity: 'medium'
      };
      const html = ErrorHandler.formatError(details);

      expect(html).toContain('retry');
    });

    test('should escape HTML in user messages', () => {
      const details = {
        type: 'UNKNOWN',
        userMessage: '<img src=x onerror=alert(1)>',
        severity: 'low'
      };
      const html = ErrorHandler.formatError(details);

      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });
  });

  describe('Error Severity Levels', () => {

    test('should mark network errors as high severity', () => {
      const error = new TypeError('Failed to fetch');
      const details = ErrorHandler.getErrorDetails(error);

      expect(details.severity).toBe('high');
    });

    test('should mark 5xx errors as high severity', () => {
      const response = { status: 500, statusText: 'Internal Server Error' };
      const details = ErrorHandler.getErrorDetails(new Error(), response);

      expect(details.severity).toBe('high');
    });

    test('should mark validation errors as medium severity', () => {
      const response = { status: 400, statusText: 'Bad Request' };
      const details = ErrorHandler.getErrorDetails(new Error(), response);

      expect(details.severity).toBe('medium');
    });

    test('should mark 404 errors as low severity', () => {
      const response = { status: 404, statusText: 'Not Found' };
      const details = ErrorHandler.getErrorDetails(new Error(), response);

      expect(details.severity).toBe('low');
    });
  });

  describe('Retry Logic Indicators', () => {

    test('should mark network errors as retryable', () => {
      const error = new TypeError('Failed to fetch');
      const details = ErrorHandler.getErrorDetails(error);

      expect(details.retryable).toBe(true);
    });

    test('should mark timeout errors as retryable', () => {
      const error = new Error('Timeout');
      error.name = 'AbortError';
      const details = ErrorHandler.getErrorDetails(error);

      expect(details.retryable).toBe(true);
    });

    test('should mark 5xx errors as retryable', () => {
      const response = { status: 503, statusText: 'Service Unavailable' };
      const details = ErrorHandler.getErrorDetails(new Error(), response);

      expect(details.retryable).toBe(true);
    });

    test('should mark 4xx errors as non-retryable', () => {
      const response = { status: 400, statusText: 'Bad Request' };
      const details = ErrorHandler.getErrorDetails(new Error(), response);

      expect(details.retryable).toBe(false);
    });

    test('should mark rate limit errors as retryable', () => {
      const response = { status: 429, statusText: 'Too Many Requests' };
      const details = ErrorHandler.getErrorDetails(new Error(), response);

      expect(details.retryable).toBe(true);
    });
  });

  describe('Edge Cases and Security', () => {

    test('should handle circular reference in error object', () => {
      const error = new Error('Test');
      error.circular = error; // Create circular reference

      expect(() => ErrorHandler.getErrorDetails(error)).not.toThrow();
    });

    test('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);
      const details = ErrorHandler.getErrorDetails(error);

      expect(details.technicalMessage).toBeDefined();
    });

    test('should sanitize error messages for XSS', () => {
      const xssError = new Error('<script>alert("XSS")</script>');
      const details = ErrorHandler.getErrorDetails(xssError);
      const html = ErrorHandler.formatError(details);

      expect(html).not.toContain('<script>');
    });

    test('should handle errors with special characters', () => {
      const error = new Error('Error: 50% of "items" aren\'t <valid>');
      const details = ErrorHandler.getErrorDetails(error);

      expect(details.technicalMessage).toBeDefined();
    });
  });
});

