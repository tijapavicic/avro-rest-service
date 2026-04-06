# Frontend Error Handling Guide

## Overview

The `simulation-launcher` web component implements comprehensive error handling to provide a robust and user-friendly experience when interacting with the simulation backend API.

## Error Handling Architecture

### 1. **Input Validation** (Client-Side)

Before sending any request to the backend, all user inputs are validated:

```javascript
_validateParameters() {
  const errors = [];
  
  // Validate p1 (0-1000 range)
  const p1 = parseFloat(this.parameters.p1);
  if (isNaN(p1) || p1 < 0 || p1 > 1000) {
    errors.push('p1 must be between 0 and 1000');
  }
  
  // Similar validation for q1, r1
  return errors;
}
```

**Benefits:**
- Prevents unnecessary network requests
- Provides immediate feedback to users
- Reduces backend load from invalid requests

---

### 2. **Network Error Handling**

Handles connection failures, DNS issues, and unreachable endpoints:

```javascript
// Detected via TypeError during fetch
if (error instanceof TypeError && error.message.includes('fetch')) {
  return {
    type: 'NETWORK_ERROR',
    title: 'Network Error',
    message: 'Unable to connect to the backend service',
    suggestion: 'Check if the backend is running and the URL is correct'
  };
}
```

**Common Causes:**
- Backend service is down
- Incorrect URL configuration
- CORS issues
- Firewall/network restrictions

---

### 3. **Timeout Handling**

Prevents indefinite waiting for slow or hung requests:

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

response = await fetch(url, {
  signal: controller.signal
});

clearTimeout(timeoutId);
```

**Configuration:**
- Default timeout: **30 seconds**
- Automatically aborts request if exceeded
- Provides clear timeout error message to user

---

### 4. **HTTP Status Code Handling**

Different HTTP errors are handled with specific guidance:

| Status Code | Error Type | User Message | Suggestion |
|------------|------------|--------------|------------|
| **400** | `BAD_REQUEST` | Invalid request parameters | Check parameter values |
| **401/403** | `AUTH_ERROR` | Not authorized | Check credentials |
| **404** | `NOT_FOUND` | Endpoint not found | Verify backend URL |
| **429** | `RATE_LIMIT` | Too many requests | Wait before retrying |
| **500+** | `SERVER_ERROR` | Backend service error | Try again later |

---

### 5. **Response Validation**

Even successful HTTP responses are validated:

```javascript
// Parse JSON
let data;
try {
  data = await response.json();
} catch (parseError) {
  throw new Error('Invalid JSON response');
}

// Validate structure
if (!data || typeof data !== 'object') {
  throw new Error('Response is not a valid object');
}
```

**Validates:**
- Response is valid JSON
- Response is an object (not null, array, primitive)
- Contains expected fields

---

## Error Display

### User-Friendly Error Messages

Errors are displayed with three levels of information:

1. **Error Type Badge** - Visual indicator of error category
2. **User Message** - Plain language explanation
3. **Suggestion** - Actionable next steps
4. **Technical Details** (collapsible) - For debugging

```html
<div style="text-align: left;">
  <div>
    <span class="badge badge-error">NETWORK_ERROR</span>
    <strong>Network Error</strong>
  </div>
  <div>Unable to connect to the backend service</div>
  <div>💡 Check if the backend is running and the URL is correct</div>
  <details>
    <summary>Technical Details</summary>
    <pre>TypeError: Failed to fetch</pre>
  </details>
</div>
```

---

## Error Types Reference

### `VALIDATION_ERROR`
- **Trigger:** Invalid user input (client-side)
- **Action:** Fix parameter values and retry
- **Example:** "p1 must be between 0 and 1000"

### `NETWORK_ERROR`
- **Trigger:** Cannot connect to backend
- **Action:** Check backend is running, verify URL
- **Example:** TypeError during fetch

### `TIMEOUT`
- **Trigger:** Request exceeds 30 seconds
- **Action:** Check backend performance, retry
- **Example:** AbortError

### `BAD_REQUEST` (400)
- **Trigger:** Backend rejects parameters
- **Action:** Review parameter values
- **Example:** Invalid systemId format

### `AUTH_ERROR` (401/403)
- **Trigger:** Authentication/authorization failure
- **Action:** Check credentials, verify permissions
- **Example:** Missing or invalid token

### `NOT_FOUND` (404)
- **Trigger:** API endpoint doesn't exist
- **Action:** Verify backend-url attribute
- **Example:** Wrong endpoint path

### `RATE_LIMIT` (429)
- **Trigger:** Too many requests
- **Action:** Wait before retrying
- **Example:** Exceeded rate limit

### `SERVER_ERROR` (500+)
- **Trigger:** Backend internal error
- **Action:** Check backend logs, retry later
- **Example:** Database connection failure

### `PARSE_ERROR`
- **Trigger:** Invalid JSON response
- **Action:** Check backend response format
- **Example:** HTML error page returned instead of JSON

### `UNKNOWN_ERROR`
- **Trigger:** Unexpected error
- **Action:** Contact support if persistent
- **Example:** Unhandled exception

---

## Progress Tracking

The component provides visual feedback during the request lifecycle:

```
0%   → Validating inputs
10%  → Initializing request
20%  → Sending request to backend
50%  → Processing response
100% → Complete!
```

If an error occurs, progress resets to **0%** with status **"Failed"**.

---

## Best Practices for Developers

### 1. **Always Validate Inputs**
```javascript
// BAD: Send without validation
await fetch(url, { body: JSON.stringify(params) });

// GOOD: Validate first
const errors = this._validateParameters();
if (errors.length > 0) {
  this._showValidationErrors(errors);
  return;
}
```

### 2. **Use Timeouts**
```javascript
// BAD: No timeout
await fetch(url);

// GOOD: Add abort controller
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);
await fetch(url, { signal: controller.signal });
```

### 3. **Check HTTP Status**
```javascript
// BAD: Assume success
const data = await response.json();

// GOOD: Check status first
if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}
const data = await response.json();
```

### 4. **Validate Response Structure**
```javascript
// BAD: Assume valid structure
console.log(data.jobId);

// GOOD: Validate first
if (!data || typeof data !== 'object') {
  throw new Error('Invalid response');
}
console.log(data.jobId || 'N/A');
```

### 5. **Provide Actionable Suggestions**
```javascript
// BAD: Generic error
"An error occurred"

// GOOD: Specific guidance
"Unable to connect to backend. Check if the service is running at http://localhost:8082"
```

### 6. **Log for Debugging**
```javascript
try {
  // ... operation
} catch (err) {
  console.error('[Component] Error:', {
    type: errorDetails.type,
    message: errorDetails.message,
    stack: err.stack
  });
}
```

---

## Testing Error Scenarios

### Test Network Errors
```javascript
// Stop backend service
// Click "Launch Simulation"
// Expected: NETWORK_ERROR with suggestion to check backend
```

### Test Timeout
```javascript
// Add delay in backend handler (>30s)
// Click "Launch Simulation"
// Expected: TIMEOUT error after 30 seconds
```

### Test Invalid Inputs
```javascript
// Enter "abc" for p1
// Click "Launch Simulation"
// Expected: VALIDATION_ERROR before request sent
```

### Test HTTP Errors
```javascript
// Configure backend to return 400/500
// Click "Launch Simulation"
// Expected: BAD_REQUEST or SERVER_ERROR with specific guidance
```

### Test Invalid Response
```javascript
// Configure backend to return HTML instead of JSON
// Click "Launch Simulation"
// Expected: PARSE_ERROR with suggestion to check backend
```

---

## Configuration

### Timeout Duration
```javascript
// Default: 30 seconds
const timeoutId = setTimeout(() => controller.abort(), 30000);

// To customize, modify the timeout value
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s
```

### Validation Rules
```javascript
// Customize in _validateParameters()
if (p1 < 0 || p1 > 1000) {
  errors.push('p1 must be between 0 and 1000');
}
```

### Error Messages
```javascript
// Customize in _getErrorDetails()
return {
  type: 'CUSTOM_ERROR',
  title: 'Custom Error Title',
  message: 'User-friendly message',
  suggestion: 'Actionable next steps',
  technical: 'Technical details for debugging'
};
```

---

## Correlation IDs

Each request includes a unique correlation ID for request tracing:

```javascript
headers: {
  'X-Correlation-Id': crypto.randomUUID()
}
```

**Benefits:**
- Track requests across frontend and backend logs
- Debug distributed issues
- Monitor request flows

**Example:**
```
[Frontend] Request: X-Correlation-Id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
[Backend] Received: X-Correlation-Id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Summary

The improved error handling provides:

✅ **Input validation** - Catch errors before network requests  
✅ **Timeout protection** - Prevent indefinite waiting  
✅ **Specific error messages** - Clear user guidance  
✅ **Response validation** - Verify response structure  
✅ **Actionable suggestions** - Help users resolve issues  
✅ **Technical details** - Aid debugging  
✅ **Visual feedback** - Progress indicators and badges  
✅ **Console logging** - Developer debugging support  
✅ **Correlation IDs** - Request tracing  

This comprehensive approach ensures a robust, user-friendly experience while providing developers with the information needed to diagnose and fix issues quickly.

