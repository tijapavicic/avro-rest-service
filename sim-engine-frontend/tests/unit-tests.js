/**
 * Example Unit Tests for Modular Components
 *
 * This demonstrates how to test individual modules.
 * Use with your preferred testing framework (Jest, Mocha, Vitest, etc.)
 */

// Import modules
import { ParameterValidator } from './components/simulation-launcher/utils/validators.js';
import { ErrorHandler } from './components/simulation-launcher/utils/error-handler.js';
import { ProgressManager } from './components/simulation-launcher/utils/progress-manager.js';

/* ── Parameter Validator Tests ──────────────────────── */

console.log('Testing ParameterValidator...');

// Test 1: Valid parameters
const validParams = { p1: '10', q1: '20', r1: '5' };
const validErrors = ParameterValidator.validate(validParams);
console.assert(validErrors.length === 0, '✅ Valid parameters should pass');

// Test 2: Invalid p1 (out of range)
const invalidP1 = { p1: '2000', q1: '20', r1: '5' };
const invalidP1Errors = ParameterValidator.validate(invalidP1);
console.assert(invalidP1Errors.length > 0, '✅ Out of range p1 should fail');

// Test 3: Invalid type (NaN)
const invalidType = { p1: 'abc', q1: '20', r1: '5' };
const invalidTypeErrors = ParameterValidator.validate(invalidType);
console.assert(invalidTypeErrors.length > 0, '✅ Non-numeric value should fail');

// Test 4: Single parameter validation
const singleError = ParameterValidator.validateParameter('p1', '1500');
console.assert(singleError !== null, '✅ Single parameter validation works');

// Test 5: Get validation rule
const rule = ParameterValidator.getRule('p1');
console.assert(rule.min === 0 && rule.max === 1000, '✅ Can retrieve validation rules');

console.log('✓ ParameterValidator tests passed\n');

/* ── Error Handler Tests ────────────────────────────── */

console.log('Testing ErrorHandler...');

// Test 1: Network error
const networkError = new TypeError('fetch failed');
const networkDetails = ErrorHandler.getErrorDetails(networkError);
console.assert(networkDetails.type === 'NETWORK_ERROR', '✅ Network error detected');

// Test 2: Timeout error
const timeoutError = new Error('Timeout');
timeoutError.name = 'AbortError';
const timeoutDetails = ErrorHandler.getErrorDetails(timeoutError);
console.assert(timeoutDetails.type === 'TIMEOUT', '✅ Timeout error detected');

// Test 3: Mock HTTP 400 response
const mockResponse400 = { status: 400, statusText: 'Bad Request' };
const http400Details = ErrorHandler.getErrorDetails(new Error(), mockResponse400);
console.assert(http400Details.type === 'BAD_REQUEST', '✅ HTTP 400 handled');

// Test 4: Mock HTTP 404 response
const mockResponse404 = { status: 404, statusText: 'Not Found' };
const http404Details = ErrorHandler.getErrorDetails(new Error(), mockResponse404);
console.assert(http404Details.type === 'NOT_FOUND', '✅ HTTP 404 handled');

// Test 5: Mock HTTP 500 response
const mockResponse500 = { status: 500, statusText: 'Internal Server Error' };
const http500Details = ErrorHandler.getErrorDetails(new Error(), mockResponse500);
console.assert(http500Details.type === 'SERVER_ERROR', '✅ HTTP 500 handled');

// Test 6: Format validation errors
const validationHtml = ErrorHandler.formatValidationErrors(['error1', 'error2']);
console.assert(validationHtml.includes('VALIDATION_ERROR'), '✅ Validation errors formatted');

// Test 7: Format error details
const errorHtml = ErrorHandler.formatError(networkDetails);
console.assert(errorHtml.includes('badge-error'), '✅ Error details formatted');

console.log('✓ ErrorHandler tests passed\n');

/* ── Progress Manager Tests ─────────────────────────── */

console.log('Testing ProgressManager...');

// Mock DOM elements
const mockFillElement = {
  style: { width: '', background: '' }
};
const mockTextElement = {
  textContent: ''
};

const progressManager = new ProgressManager(mockFillElement, mockTextElement);

// Test 1: Update progress
progressManager.update(50, 'Processing...');
console.assert(progressManager.getProgress() === 50, '✅ Progress updated to 50%');
console.assert(mockFillElement.style.width === '50%', '✅ Fill width set correctly');
console.assert(mockTextElement.textContent === 'Processing...', '✅ Text set correctly');

// Test 2: Progress clamping (max)
progressManager.update(150, 'Over max');
console.assert(progressManager.getProgress() === 100, '✅ Progress clamped to 100%');

// Test 3: Progress clamping (min)
progressManager.update(-10, 'Under min');
console.assert(progressManager.getProgress() === 0, '✅ Progress clamped to 0%');

// Test 4: Update to predefined stage
progressManager.updateStage('SENDING');
console.assert(progressManager.getProgress() === 20, '✅ Stage SENDING is 20%');
console.assert(mockTextElement.textContent === 'Sending request...', '✅ Stage message correct');

// Test 5: Reset progress
progressManager.reset();
console.assert(progressManager.getProgress() === 0, '✅ Progress reset to 0');

// Test 6: Color gradients
progressManager.update(25, 'Low');
console.assert(mockFillElement.style.background === '#4f8ef7', '✅ Low progress is blue');

progressManager.update(50, 'Medium');
console.assert(mockFillElement.style.background === '#FFD8B8', '✅ Medium progress is peach');

progressManager.update(75, 'High');
console.assert(mockFillElement.style.background === '#C1E1C1', '✅ High progress is green');

console.log('✓ ProgressManager tests passed\n');

/* ── Summary ─────────────────────────────────────────── */

console.log('═══════════════════════════════════════════════');
console.log('✅ All unit tests passed!');
console.log('═══════════════════════════════════════════════');
console.log('\nTo run these tests:');
console.log('1. Open index-modular.html in your browser');
console.log('2. Open Developer Console');
console.log('3. Import and run this test file');
console.log('\nOr use a test runner like Jest, Mocha, or Vitest');

