# Modular Frontend - Quick Start Guide

## 🚀 Get Started

### 1. View the Demo

```bash
cd sim-engine-frontend
python3 -m http.server 8080
```

Then open: **http://localhost:3000/index-modular.html**

---

## 📁 New File Structure

```
sim-engine-frontend/
├── index-modular.html              # New modular version
├── package.json                    # NPM configuration
├── ARCHITECTURE.md                 # Complete architecture documentation
├── components/
│   └── simulation-launcher/
│       ├── simulation-launcher.js  # Main orchestrator
│       ├── styles/                 # Separated CSS files
│       │   ├── main.css
│       │   ├── parameters.css
│       │   ├── progress.css
│       │   ├── buttons.css
│       │   ├── status.css
│       │   └── badges.css
│       ├── utils/                  # Business logic modules
│       │   ├── validators.js
│       │   ├── error-handler.js
│       │   ├── progress-manager.js
│       │   └── api-client.js
│       └── templates/              # UI generation
│           ├── html-template.js
│           └── style-loader.js
└── tests/
    └── unit-tests.js               # Example unit tests
```

---

## 🎯 Key Features

### ✅ Separation of Concerns
- **CSS** → 6 separate files by feature
- **JavaScript** → 7 modules with single responsibilities
- **Templates** → HTML and style loading separated
- **Business Logic** → Isolated from presentation

### ✅ Modular Architecture
- Each module is independently testable
- Clear import/export boundaries
- No global state pollution
- ES6 module system

### ✅ Maintainability
- Easy to locate code
- Clear naming conventions
- Organized directory structure
- Comprehensive documentation

---

## 📖 Quick Reference

### Import Individual Modules

```javascript
// Validators
import { ParameterValidator } from './utils/validators.js';
const errors = ParameterValidator.validate({ p1: '10', q1: '20', r1: '3' });

// Error Handler
import { ErrorHandler } from './utils/error-handler.js';
const errorDetails = ErrorHandler.getErrorDetails(error, response);

// Progress Manager
import { ProgressManager } from './utils/progress-manager.js';
const manager = new ProgressManager(fillEl, textEl);
manager.updateStage('SENDING');

// API Client
import { ApiClient } from './utils/api-client.js';
const client = new ApiClient('http://localhost:8082/api/simulations');
const response = await client.submitSimulation(payload);
```

### Use the Web Component

```html
<simulation-launcher 
  backend-url="http://localhost:8082/api/simulations"
  system-id="SYS-001">
</simulation-launcher>

<script type="module" src="./components/simulation-launcher/simulation-launcher.js"></script>
```

### Programmatic API

```javascript
const launcher = document.querySelector('simulation-launcher');

// Get/Set parameters
const params = launcher.getParameters();
launcher.setParameters({ p1: '20', q1: '30', r1: '5' });

// Launch simulation
await launcher.launch();

// Reset
launcher.reset();
```

---

## 🧪 Testing

Run unit tests in browser console:

```javascript
import './tests/unit-tests.js';
```

Or use a test framework like Jest:

```bash
npm install --save-dev jest
npm test
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture guide
- **[ERROR-HANDLING-GUIDE.md](./ERROR-HANDLING-GUIDE.md)** - Error handling documentation
- **[ERROR-HANDLING-README.md](./ERROR-HANDLING-README.md)** - Error docs overview

---

## 🔧 Development

### Add a New Feature

1. **Identify the module** (validators, error-handler, etc.)
2. **Edit the module file** in `utils/` or `templates/`
3. **Update tests** in `tests/`
4. **Update documentation** if needed

### Add New Styles

1. Create CSS file in `styles/`
2. Add to `StyleLoader.CSS_FILES` array
3. Add getter in `StyleLoader.getInlineStyles()`

### Add New Validation Rule

Edit `utils/validators.js`:
```javascript
static RULES = {
  p1: { min: 0, max: 1000, name: 'Primary coefficient' },
  // Add your rule here
  newParam: { min: 0, max: 50, name: 'New parameter' }
};
```

---

## 🎨 Customization

### Change Colors

Edit individual CSS files in `styles/`:

```css
/* styles/buttons.css */
button {
  background: #your-brand-color;
}
```

### Change Timeout

Edit `utils/api-client.js`:

```javascript
static DEFAULT_TIMEOUT = 60000; // 60 seconds
```

### Change Progress Stages

Edit `utils/progress-manager.js`:

```javascript
static STAGES = {
  VALIDATING: { percent: 0, message: 'Validating...' },
  // Add/modify stages
  CUSTOM: { percent: 30, message: 'Custom stage...' }
};
```

---

## 📊 Module Overview

| Module | Purpose | Exports |
|--------|---------|---------|
| `validators.js` | Input validation | `ParameterValidator` |
| `error-handler.js` | Error categorization | `ErrorHandler` |
| `progress-manager.js` | Progress state | `ProgressManager` |
| `api-client.js` | HTTP communication | `ApiClient` |
| `html-template.js` | HTML generation | `HtmlTemplate` |
| `style-loader.js` | CSS loading | `StyleLoader` |
| `simulation-launcher.js` | Main orchestrator | `SimulationLauncher` |

---

## 🔗 Integration

Works with any framework:
- ✅ Vanilla JavaScript
- ✅ React
- ✅ Vue
- ✅ Angular
- ✅ Svelte

See [ARCHITECTURE.md](./ARCHITECTURE.md) for integration examples.

---

## ✨ What's New

**v2.0.0 - Modular Architecture**

- ✅ Separated CSS into 6 files
- ✅ Split JavaScript into 7 modules
- ✅ Added comprehensive error handling
- ✅ Improved progress management
- ✅ Better testability
- ✅ Full documentation
- ✅ Example unit tests
- ✅ 100% backward compatible API

---

## 🤝 Contributing

1. Follow separation of concerns
2. Keep modules small and focused
3. Add JSDoc comments
4. Write unit tests
5. Update documentation

---

**Happy Coding! 🚀**

