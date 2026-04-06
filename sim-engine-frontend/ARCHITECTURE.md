# Simulation Launcher - Modular Architecture

## 📐 Architecture Overview

This web component follows **separation of concerns** principles with a clean, maintainable modular structure.

```
components/simulation-launcher/
├── simulation-launcher.js       # Main component (orchestrator)
├── styles/                      # CSS modules
│   ├── main.css                # Base card styles
│   ├── parameters.css          # Parameter table
│   ├── progress.css            # Progress bar
│   ├── buttons.css             # Button styles
│   ├── status.css              # Status & result display
│   └── badges.css              # Badge components
├── utils/                       # Business logic modules
│   ├── validators.js           # Input validation
│   ├── error-handler.js        # Error categorization
│   ├── progress-manager.js     # Progress state management
│   └── api-client.js           # HTTP client
└── templates/                   # UI generation
    ├── html-template.js        # HTML structure
    └── style-loader.js         # CSS loader
```

---

## 🎯 Design Principles

### 1. **Single Responsibility**
Each module has one clear purpose:
- `validators.js` → Input validation only
- `error-handler.js` → Error processing only
- `api-client.js` → HTTP communication only

### 2. **Separation of Concerns**
- **Presentation** → CSS files + HTML templates
- **Business Logic** → Validators, API client
- **State Management** → Progress manager
- **Error Handling** → Error handler

### 3. **Modularity**
- All modules are ES6 classes
- Export public APIs
- Import only what's needed
- No global state pollution

### 4. **Testability**
- Each module can be unit tested independently
- Pure functions where possible
- Clear input/output contracts

### 5. **Maintainability**
- Easy to locate code
- Clear file naming
- Organized directory structure
- Minimal coupling

---

## 📦 Module Reference

### Core Component

#### `simulation-launcher.js`
**Main orchestrator** that coordinates all modules.

```javascript
import SimulationLauncher from './simulation-launcher.js';

// Use as web component
<simulation-launcher 
  backend-url="http://localhost:8082/api/simulations"
  system-id="SYS-001">
</simulation-launcher>

// Or programmatically
const launcher = document.querySelector('simulation-launcher');
launcher.setParameters({ p1: '20', q1: '30', r1: '5' });
await launcher.launch();
```

**Responsibilities:**
- Lifecycle management
- Event handling
- Module coordination
- DOM manipulation
- Public API

---

### Utilities

#### `validators.js`
Parameter validation with configurable rules.

```javascript
import { ParameterValidator } from './utils/validators.js';

// Validate all parameters
const errors = ParameterValidator.validate({ p1: '10', q1: '20', r1: '3' });
// Returns: [] if valid, ['error1', 'error2'] if invalid

// Validate single parameter
const error = ParameterValidator.validateParameter('p1', '150');
// Returns: null if valid, 'error message' if invalid

// Get validation rule
const rule = ParameterValidator.getRule('p1');
// Returns: { min: 0, max: 1000, name: 'Primary coefficient' }
```

**Features:**
- Configurable validation rules
- Range validation
- Type checking
- Individual or batch validation

---

#### `error-handler.js`
Error categorization and formatting.

```javascript
import { ErrorHandler } from './utils/error-handler.js';

// Get error details
const errorDetails = ErrorHandler.getErrorDetails(error, response);
// Returns: { type, title, message, suggestion, technical }

// Format for display
const html = ErrorHandler.formatError(errorDetails);

// Format validation errors
const validationHtml = ErrorHandler.formatValidationErrors(['error1', 'error2']);
```

**Error Types:**
- `VALIDATION_ERROR` - Invalid inputs
- `NETWORK_ERROR` - Connection failed
- `TIMEOUT` - Request timeout
- `BAD_REQUEST` - HTTP 400
- `AUTH_ERROR` - HTTP 401/403
- `NOT_FOUND` - HTTP 404
- `RATE_LIMIT` - HTTP 429
- `SERVER_ERROR` - HTTP 500+
- `PARSE_ERROR` - Invalid JSON
- `UNKNOWN_ERROR` - Unexpected

---

#### `progress-manager.js`
Progress bar state management.

```javascript
import { ProgressManager } from './utils/progress-manager.js';

// Initialize
const manager = new ProgressManager(fillElement, textElement);

// Update progress
manager.update(50, 'Processing...');

// Use predefined stages
manager.updateStage('SENDING');
// Stages: VALIDATING, INITIALIZING, SENDING, PROCESSING, COMPLETE, FAILED

// Reset
manager.reset();

// Get current progress
const percent = manager.getProgress();
```

**Features:**
- Predefined stages
- Automatic color gradients
- State tracking
- Smooth transitions

---

#### `api-client.js`
HTTP client for backend communication.

```javascript
import { ApiClient } from './utils/api-client.js';

// Initialize
const client = new ApiClient('http://localhost:8082/api/simulations', 30000);

// Submit simulation
const response = await client.submitSimulation(payload);

// Update configuration
client.setBaseUrl('http://new-backend:8082/api/simulations');
client.setTimeout(60000);

// Get configuration
const config = client.getConfig();
```

**Features:**
- Configurable timeout (default 30s)
- Automatic correlation IDs
- AbortController support
- Error response handling

---

### Templates

#### `html-template.js`
HTML structure generation.

```javascript
import { HtmlTemplate } from './templates/html-template.js';

// Generate complete template
const html = HtmlTemplate.generate({ p1: '10', q1: '20', r1: '3' });

// Individual sections
const params = HtmlTemplate.parameterSection(parameters);
const progress = HtmlTemplate.progressSection();
const buttons = HtmlTemplate.buttonSection();
```

**Sections:**
- Parameter table
- Progress bar
- Buttons
- Status display
- Result display

---

#### `style-loader.js`
CSS loading and management.

```javascript
import { StyleLoader } from './templates/style-loader.js';

// Get inline styles (for immediate rendering)
const css = StyleLoader.getInlineStyles();

// Load from files (async)
const styles = await StyleLoader.loadStyles('/components/simulation-launcher');
```

**CSS Modules:**
- `main.css` - Base styles
- `parameters.css` - Parameter table
- `progress.css` - Progress bar
- `buttons.css` - Buttons
- `status.css` - Status/result
- `badges.css` - Badge styles

---

## 🚀 Usage

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>Simulation Launcher</title>
</head>
<body>
  <simulation-launcher 
    backend-url="http://localhost:8082/api/simulations"
    system-id="SYS-001">
  </simulation-launcher>

  <script type="module" src="./components/simulation-launcher/simulation-launcher.js"></script>
</body>
</html>
```

### Programmatic API

```javascript
const launcher = document.querySelector('simulation-launcher');

// Get parameters
const params = launcher.getParameters();
// { p1: '10.5', q1: '25.0', r1: '3.14' }

// Set parameters
launcher.setParameters({ p1: '20', q1: '30', r1: '5' });

// Launch simulation
await launcher.launch();

// Reset
launcher.reset();
```

---

## 🧪 Testing

### Unit Testing Modules

Each module can be tested independently:

```javascript
// Test validators
import { ParameterValidator } from './utils/validators.js';

test('validates p1 range', () => {
  const error = ParameterValidator.validateParameter('p1', '1500');
  expect(error).toBe('p1 must be between 0 and 1000');
});

// Test error handler
import { ErrorHandler } from './utils/error-handler.js';

test('categorizes network errors', () => {
  const error = new TypeError('fetch failed');
  const details = ErrorHandler.getErrorDetails(error);
  expect(details.type).toBe('NETWORK_ERROR');
});

// Test progress manager
import { ProgressManager } from './utils/progress-manager.js';

test('updates progress', () => {
  const manager = new ProgressManager(mockFill, mockText);
  manager.update(50, 'Processing');
  expect(manager.getProgress()).toBe(50);
});
```

### Integration Testing

```javascript
// Test component
import SimulationLauncher from './simulation-launcher.js';

test('launches simulation', async () => {
  const launcher = new SimulationLauncher();
  launcher.setParameters({ p1: '10', q1: '20', r1: '3' });
  const result = await launcher.launch();
  expect(result.status).toBe('SUBMITTED');
});
```

---

## 🔧 Configuration

### Validation Rules

Customize in `validators.js`:

```javascript
static RULES = {
  p1: { min: 0, max: 1000, name: 'Primary coefficient' },
  q1: { min: 0, max: 1000, name: 'Quality factor' },
  r1: { min: 0, max: 100, name: 'Rate constant' }
};
```

### Timeout Settings

Customize in `api-client.js`:

```javascript
static DEFAULT_TIMEOUT = 30000; // 30 seconds
```

### Progress Stages

Customize in `progress-manager.js`:

```javascript
static STAGES = {
  VALIDATING: { percent: 0, message: 'Validating...' },
  INITIALIZING: { percent: 10, message: 'Initializing...' },
  SENDING: { percent: 20, message: 'Sending request...' },
  PROCESSING: { percent: 50, message: 'Processing...' },
  COMPLETE: { percent: 100, message: 'Complete!' },
  FAILED: { percent: 0, message: 'Failed' }
};
```

---

## 📁 File Organization

```
sim-engine-frontend/
├── index.html                   # Original monolithic version
├── index-modular.html           # New modular version
├── components/
│   ├── simulation-launcher.js   # Original (deprecated)
│   └── simulation-launcher/     # New modular structure
│       ├── simulation-launcher.js
│       ├── styles/
│       │   ├── main.css
│       │   ├── parameters.css
│       │   ├── progress.css
│       │   ├── buttons.css
│       │   ├── status.css
│       │   └── badges.css
│       ├── utils/
│       │   ├── validators.js
│       │   ├── error-handler.js
│       │   ├── progress-manager.js
│       │   └── api-client.js
│       └── templates/
│           ├── html-template.js
│           └── style-loader.js
└── ERROR-HANDLING-GUIDE.md
```

---

## 🎨 Styling

All styles use a **pastel dark theme**:

| Element | Color | Variable |
|---------|-------|----------|
| Background | `#1a1d27` | Card background |
| Border | `#2e3347` | Borders |
| Primary | `#4f8ef7` | Blue accent |
| Success | `#C1E1C1` | Pastel green |
| Error | `#f87171` | Red |
| Text | `#e2e8f0` | Light text |
| Muted | `#94a3b8` | Muted text |

### Customizing Styles

Edit individual CSS files in `styles/`:

```css
/* styles/buttons.css */
button {
  background: #4f8ef7;  /* Change to your brand color */
  color: #fff;
  /* ... */
}
```

---

## 🔌 Integration

### With React

```jsx
import { useEffect, useRef } from 'react';
import './components/simulation-launcher/simulation-launcher.js';

function App() {
  const launcherRef = useRef(null);

  const handleLaunch = async () => {
    await launcherRef.current.launch();
  };

  return (
    <div>
      <simulation-launcher 
        ref={launcherRef}
        backend-url="http://localhost:8082/api/simulations"
      />
      <button onClick={handleLaunch}>Launch</button>
    </div>
  );
}
```

### With Vue

```vue
<template>
  <div>
    <simulation-launcher 
      ref="launcher"
      backend-url="http://localhost:8082/api/simulations"
    />
  </div>
</template>

<script>
import './components/simulation-launcher/simulation-launcher.js';

export default {
  methods: {
    async launch() {
      await this.$refs.launcher.launch();
    }
  }
}
</script>
```

### With Angular

```typescript
import { Component } from '@angular/core';
import './components/simulation-launcher/simulation-launcher.js';

@Component({
  selector: 'app-root',
  template: `
    <simulation-launcher 
      #launcher
      backend-url="http://localhost:8082/api/simulations">
    </simulation-launcher>
  `
})
export class AppComponent {
  async launch() {
    const launcher = document.querySelector('simulation-launcher');
    await launcher.launch();
  }
}
```

---

## 🚦 Migration Guide

### From Monolithic to Modular

**Before:**
```html
<script src="./components/simulation-launcher.js"></script>
```

**After:**
```html
<script type="module" src="./components/simulation-launcher/simulation-launcher.js"></script>
```

### API Compatibility

The new modular version is **100% backward compatible** with the same public API:

- Same custom element name: `<simulation-launcher>`
- Same attributes: `backend-url`, `system-id`
- Same methods: `launch()`, `getParameters()`, `setParameters()`, `reset()`

---

## 📊 Benefits

### ✅ Maintainability
- Easy to locate and modify code
- Clear module boundaries
- Reduced coupling

### ✅ Testability
- Unit test individual modules
- Mock dependencies easily
- Integration tests simplified

### ✅ Scalability
- Add new features without touching existing code
- Easy to extend validators, error types, etc.
- Parallel development possible

### ✅ Reusability
- Modules can be reused in other projects
- API client works standalone
- Validators are framework-agnostic

### ✅ Performance
- Tree-shaking eliminates unused code
- Lazy loading possible
- Better browser caching

---

## 🛠️ Development

### Adding a New Validator

1. Edit `utils/validators.js`:
```javascript
static RULES = {
  // ...existing rules
  newParam: { min: 0, max: 50, name: 'New parameter' }
};
```

2. Update template in `templates/html-template.js`
3. Update default values in `simulation-launcher.js`

### Adding a New Error Type

1. Edit `utils/error-handler.js`:
```javascript
static TYPES = {
  // ...existing types
  NEW_ERROR: 'NEW_ERROR'
};
```

2. Add handler in `_handleHttpError()` or `getErrorDetails()`

### Adding New Styles

1. Create new CSS file in `styles/`
2. Add to `StyleLoader.CSS_FILES` array
3. Add getter in `StyleLoader.getInlineStyles()`

---

## 📄 License

Part of the avro-rest-service project. See main repository LICENSE file.

---

## 🤝 Contributing

When contributing to this module:

1. ✅ Follow separation of concerns
2. ✅ Keep modules small and focused
3. ✅ Export clear public APIs
4. ✅ Add JSDoc comments
5. ✅ Update this README
6. ✅ Write unit tests
7. ✅ Test in all major browsers

---

## 📞 Support

For issues or questions:
- Check existing documentation
- Review module source code
- Create a GitHub issue
- Contact the development team

---

**Built with ❤️ using modern web standards and best practices**

