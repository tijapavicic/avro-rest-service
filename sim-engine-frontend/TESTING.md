# 🧪 Testing the Simulation Launcher Component

**Created:** April 7, 2026  
**Updated:** April 7, 2026  
**Purpose:** Comprehensive testing guide with modern design and 215+ unit tests

---

## 📋 Table of Contents

1. [Quick Manual Testing](#quick-manual-testing)
2. [Automated Unit Tests](#automated-unit-tests)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Visual Tests](#visual-tests)
6. [Functional Tests](#functional-tests)

---

## 🚀 Quick Manual Testing

### Step 1: Open Test Page

```bash
cd /Users/copor/CodexProjects/avro-rest-service/sim-engine-frontend
open test.html
```

### Step 2: Test Without Backend (Error Handling)

1. Open `test.html` in your browser
2. Edit parameters (p1, q1, r1)
3. Click "🚀 Launch Simulation"
4. **Expected:** Progress bar shows, then error badge appears
5. **This is normal** - backend is not running

### Step 3: Test With Mock Backend

```bash
# Terminal 1: Start mock server (requires Node.js)
cd sim-engine-frontend
./start-mock-server.sh

# Terminal 2: Open test page
open test.html
```

---

## 🤖 Automated Unit Tests

### Test Suite Overview

We have **215+ comprehensive unit tests** covering all modules:

| Test File | Module | Tests | Purpose |
|-----------|--------|-------|---------|
| `validators.test.js` | ParameterValidator | 40+ | Input validation & security |
| `error-handler.test.js` | ErrorHandler | 45+ | Error categorization & formatting |
| `progress-manager.test.js` | ProgressManager | 50+ | Progress state management |
| `api-client.test.js` | ApiClient | 45+ | HTTP communication |
| `integration.test.js` | SimulationLauncher | 35+ | End-to-end workflows |

### Installation

```bash
cd /Users/copor/CodexProjects/avro-rest-service/sim-engine-frontend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Verbose output
npm run test:verbose
```

### Test Examples

#### Validation Tests
```javascript
✓ should pass with all valid parameters
✓ should fail with p1 out of range (negative)
✓ should handle decimal values correctly
✓ should reject SQL injection attempts
✓ should validate 1000 parameter sets quickly
```

#### Error Handler Tests
```javascript
✓ should detect network error from TypeError
✓ should handle 400 Bad Request
✓ should handle 500 Internal Server Error
✓ should escape HTML in error messages
✓ should mark network errors as retryable
```

#### Progress Manager Tests
```javascript
✓ should update to 50%
✓ should clamp progress above 100%
✓ should update to VALIDATING stage (10%)
✓ should use blue color for low progress
✓ should handle rapid updates efficiently
```

#### API Client Tests
```javascript
✓ should send POST request with payload
✓ should include default headers
✓ should handle 404 Not Found
✓ should handle timeout errors
✓ should serialize object payloads
```

#### Integration Tests
```javascript
✓ should render in the DOM
✓ should submit valid parameters successfully
✓ should show progress during submission
✓ should prevent submission with invalid parameters
✓ should handle rapid button clicks
```

### Coverage Report

After running `npm run test:coverage`, open:
```bash
open coverage/lcov-report/index.html
```

**Coverage Targets:**
- Statements: 70%+
- Branches: 70%+  
- Functions: 70%+
- Lines: 70%+

---

## ✅ Test Checklist

### Visual Tests

- [ ] Parameter table displays with 3 rows
- [ ] Default values: p1=10.5, q1=25.0, r1=3.14
- [ ] Input fields are editable
- [ ] Parameter names in purple (#E0BBE4)
- [ ] Input borders are blue (#4f8ef7)
- [ ] Table rows highlight on hover
- [ ] Input fields glow blue on focus

### Functional Tests

- [ ] Edit p1 value → changes in memory
- [ ] Edit q1 value → changes in memory
- [ ] Edit r1 value → changes in memory
- [ ] Click "Launch Simulation" → button disables
- [ ] Progress bar appears (0%)
- [ ] Progress bar animates to 20%
- [ ] Progress bar animates to 50%
- [ ] Progress bar animates to 100%
- [ ] Progress bar color changes:
  - Blue (0-33%)
  - Peach (34-66%)
  - Green (67-100%)

### Error Handling Tests (No Backend)

- [ ] Click launch with backend offline
- [ ] Progress bar shows briefly
- [ ] Error badge appears: "ERROR"
- [ ] Error message shows: "Failed to fetch" or similar
- [ ] Button re-enables
- [ ] Can retry

### Success Tests (With Mock Backend)

- [ ] Click launch with backend running
- [ ] Progress bar completes
- [ ] Success badge shows: "SUBMITTED"
- [ ] Job ID displays
- [ ] JSON response shows in result panel
- [ ] Parameters sent correctly in payload

---

## 🔧 Manual Testing Options

### Option 1: Browser Console Test

Open browser DevTools Console and run:

```javascript
// Get the component
const launcher = document.querySelector('simulation-launcher');

// Check default parameters
console.log('Parameters:', launcher.parameters);

// Modify parameters programmatically
launcher.parameters.p1 = '15.5';
launcher.parameters.q1 = '30.0';
launcher.parameters.r1 = '2.71';

// Check Shadow DOM
console.log('Shadow Root:', launcher.shadowRoot);

// Get progress bar
const progressBar = launcher.shadowRoot.getElementById('progress-bar');
console.log('Progress Bar:', progressBar);
```

### Option 2: Test File Directly

Just open `test.html` - no server needed for basic UI testing!

```bash
# macOS
open test.html

# Linux
xdg-open test.html

# Windows
start test.html
```

### Option 3: Use Python HTTP Server

```bash
cd sim-engine-frontend
python3 -m http.server 8000

# Then open: http://localhost:8000/test.html
```

---

## 📊 Expected Behaviors

### Scenario 1: Backend Offline (Default)

```
Action: Click "Launch Simulation"
↓
Progress: 0% → Initializing...
↓
Progress: 20% → Sending request...
↓
ERROR: Failed to fetch
↓
Progress bar disappears
↓
Badge: [ERROR] Failed to fetch
```

### Scenario 2: Backend Online (With Mock Server)

```
Action: Click "Launch Simulation"
↓
Progress: 0% → Initializing... (Blue)
↓
Progress: 20% → Sending request... (Blue)
↓
Progress: 50% → Processing... (Peach)
↓
Progress: 100% → Complete! (Green)
↓
Badge: [SUBMITTED] Job ID: job-1234567890
↓
JSON Result displayed
```

### Scenario 3: Parameter Editing

```
Default: p1=10.5, q1=25.0, r1=3.14
↓
User changes: p1=15.5
↓
Internal state updates: this.parameters.p1 = '15.5'
↓
Click Launch
↓
Payload sent: { parameters: { p1: 15.5, q1: 25.0, r1: 3.14 } }
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch"

**Cause:** Backend not running or CORS issue  
**Fix:** 
```bash
# Start mock server
./start-mock-server.sh
```

### Issue: "Module not found"

**Cause:** File path incorrect  
**Fix:** Make sure you're in the `sim-engine-frontend` directory

### Issue: Progress bar doesn't show

**Cause:** CSS class not applied  
**Fix:** Check browser console for errors

### Issue: Parameters not sending

**Cause:** Values not parsed  
**Fix:** Check `parseFloat()` conversion in code

### Issue: HTTPS certificate error

**Cause:** Self-signed certificate not trusted  
**Fix:** 
```bash
# Install mkcert
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Move certs to expected location
mkdir -p ~/.localhost-ssl
mv localhost+2.pem ~/.localhost-ssl/localhost-cert.pem
mv localhost+2-key.pem ~/.localhost-ssl/localhost-key.pem
```

---

## 📸 Screenshots to Verify

### 1. Initial State
- Parameter table visible
- Progress bar hidden
- Button enabled
- No status message

### 2. During Request
- Button disabled
- Progress bar visible
- Progress text showing (e.g., "50% Processing...")
- Progress bar colored (Blue/Peach/Green)

### 3. Success State
- Button enabled
- Progress bar at 100% (Green)
- Badge showing "SUBMITTED"
- Job ID displayed
- JSON result visible

### 4. Error State
- Button enabled
- Progress bar hidden
- Badge showing "ERROR"
- Error message displayed

---

## 🎯 Acceptance Criteria

All tests must pass:

✅ **Visual Design**
- Colors match pastel palette
- Layout is responsive
- Typography is consistent
- Spacing is uniform

✅ **Functionality**
- Parameters are editable
- Values persist when typing
- Progress bar animates smoothly
- Colors change at correct thresholds
- Button states work (enabled/disabled)

✅ **Error Handling**
- Network errors show error badge
- HTTP errors show status code
- Progress bar resets on error
- User can retry after error

✅ **Success Flow**
- Progress completes to 100%
- Badge shows success status
- JSON result displays
- Job ID is visible

---

## 📝 Test Results Template

Copy this and fill out:

```
Date: ___________
Tester: ___________

VISUAL TESTS:
[ ] Parameter table displays correctly
[ ] Progress bar visible during request
[ ] Colors match pastel palette
[ ] Hover effects work
[ ] Focus states work

FUNCTIONAL TESTS:
[ ] Can edit p1
[ ] Can edit q1
[ ] Can edit r1
[ ] Progress animates 0→100%
[ ] Colors change (Blue→Peach→Green)
[ ] Button disables during request

ERROR HANDLING:
[ ] Shows error badge
[ ] Shows error message
[ ] Can retry after error

SUCCESS FLOW (with backend):
[ ] Progress completes
[ ] Shows success badge
[ ] Shows job ID
[ ] Displays JSON result

NOTES:
___________________________________
___________________________________
___________________________________
```

---

## 🔗 Related Files

- **Test Page:** `test.html`
- **Component:** `components/simulation-launcher.js`
- **Mock Server:** `start-mock-server.sh`
- **Main Page:** `index.html`
- **Styles:** `style.css`

---

## 📞 Need Help?

Check these resources:
- [Frontend README](./README.md)
- [Browser Console] for JavaScript errors
- [Network Tab] in DevTools for API requests

---

**Status:** Ready for Testing ✅  
**Last Updated:** April 7, 2026

