# Migration Guide: Monolithic → Modular Architecture

## 📋 Overview

This guide helps you migrate from the monolithic `simulation-launcher.js` to the new modular architecture.

---

## 🔄 What's Changed

### Before (Monolithic)
```
components/
└── simulation-launcher.js  (663 lines, all-in-one)
```

### After (Modular)
```
components/simulation-launcher/
├── simulation-launcher.js       (Main orchestrator - 300 lines)
├── styles/                      (CSS separated)
│   ├── main.css
│   ├── parameters.css
│   ├── progress.css
│   ├── buttons.css
│   ├── status.css
│   └── badges.css
├── utils/                       (Business logic)
│   ├── validators.js
│   ├── error-handler.js
│   ├── progress-manager.js
│   └── api-client.js
└── templates/                   (UI generation)
    ├── html-template.js
    └── style-loader.js
```

---

## ✅ Backward Compatibility

The new modular version is **100% backward compatible**:

| Feature | Old API | New API | Compatible? |
|---------|---------|---------|-------------|
| Element name | `<simulation-launcher>` | `<simulation-launcher>` | ✅ Yes |
| Attributes | `backend-url`, `system-id` | `backend-url`, `system-id` | ✅ Yes |
| Methods | `launch()` | `launch()` | ✅ Yes |
| Parameters | `getParameters()`, `setParameters()` | `getParameters()`, `setParameters()` | ✅ Yes |
| Events | Same | Same | ✅ Yes |

---

## 🚀 Migration Steps

### Step 1: Update HTML Import

**Before:**
```html
<script src="./components/simulation-launcher.js"></script>
```

**After:**
```html
<script type="module" src="./components/simulation-launcher/simulation-launcher.js"></script>
```

⚠️ **Important:** Add `type="module"` to enable ES6 modules.

---

### Step 2: (Optional) Update File References

If you have **no custom references** to the old file, you're done!

If you **do** have custom imports:

**Before:**
```javascript
import './components/simulation-launcher.js';
```

**After:**
```javascript
import './components/simulation-launcher/simulation-launcher.js';
```

---

### Step 3: Test Your Application

1. Open your application in a browser
2. Open Developer Console
3. Verify no errors
4. Test the simulation launcher functionality
5. Verify all features work as before

---

## 🧪 Testing Checklist

- [ ] Component loads without errors
- [ ] Parameters can be edited
- [ ] Launch button works
- [ ] Progress bar displays correctly
- [ ] Validation errors show properly
- [ ] Network errors are handled
- [ ] Success response displays
- [ ] Styling looks the same
- [ ] All attributes work (`backend-url`, `system-id`)
- [ ] Programmatic API works (`launch()`, `getParameters()`, etc.)

---

## 🎯 Key Differences

### 1. Module System

**Before:** Single file, global scope
```javascript
class SimulationLauncher extends HTMLElement {
  // 663 lines of code
}
customElements.define('simulation-launcher', SimulationLauncher);
```

**After:** ES6 modules with imports
```javascript
import { ParameterValidator } from './utils/validators.js';
import { ErrorHandler } from './utils/error-handler.js';
// ... other imports

class SimulationLauncher extends HTMLElement {
  // 300 lines - orchestration only
}
export default SimulationLauncher;
```

---

### 2. CSS Separation

**Before:** Inline CSS in template string (200+ lines)
```javascript
this.shadowRoot.innerHTML = `
  <style>
    /* 200+ lines of CSS */
  </style>
  <div>...</div>
`;
```

**After:** Separate CSS files
```javascript
import { StyleLoader } from './templates/style-loader.js';
const styles = StyleLoader.getInlineStyles();
```

---

### 3. Business Logic Extraction

**Before:** Validation inline
```javascript
_validateParameters() {
  const errors = [];
  const p1 = parseFloat(this.parameters.p1);
  if (isNaN(p1)) {
    errors.push('p1 must be a valid number');
  }
  // ... more validation
  return errors;
}
```

**After:** Separate validator module
```javascript
import { ParameterValidator } from './utils/validators.js';
const errors = ParameterValidator.validate(this.parameters);
```

---

## 🔧 Customization Migration

### Changing Validation Rules

**Before:** Edit `simulation-launcher.js` line ~350
```javascript
_validateParameters() {
  // Edit validation logic here
}
```

**After:** Edit `utils/validators.js`
```javascript
static RULES = {
  p1: { min: 0, max: 1000, name: 'Primary coefficient' }
  // Add/modify rules here
};
```

---

### Changing Styles

**Before:** Edit `simulation-launcher.js` line ~80 (inside template string)
```javascript
this.shadowRoot.innerHTML = `
  <style>
    button {
      background: #4f8ef7;
      /* Edit styles here */
    }
  </style>
`;
```

**After:** Edit `styles/buttons.css`
```css
button {
  background: #4f8ef7;
  /* Edit styles here */
}
```

---

### Changing Error Handling

**Before:** Edit `simulation-launcher.js` line ~400
```javascript
_getErrorDetails(error, response = null) {
  // Edit error handling logic here
}
```

**After:** Edit `utils/error-handler.js`
```javascript
static getErrorDetails(error, response = null) {
  // Edit error handling logic here
}
```

---

## 📦 Benefits of Migration

### ✅ Maintainability
- **Before:** 663 lines in one file
- **After:** Largest file is 300 lines, most are <100 lines

### ✅ Testability
- **Before:** Hard to test individual features
- **After:** Each module is independently testable

### ✅ Reusability
- **Before:** Can only use the entire component
- **After:** Can import and use individual modules

### ✅ Collaboration
- **Before:** Merge conflicts on single file
- **After:** Team members can work on different modules

### ✅ Performance
- **Before:** All code loaded at once
- **After:** Potential for tree-shaking and lazy loading

---

## ⚠️ Potential Issues

### Issue 1: Browser Compatibility

**Problem:** ES6 modules require modern browsers

**Solution:** Use a bundler (Webpack, Rollup, Vite) or transpile for older browsers

```bash
npm install --save-dev vite
npx vite build
```

---

### Issue 2: CORS Errors with file://

**Problem:** ES6 modules don't work with `file://` protocol

**Solution:** Use a local server

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

---

### Issue 3: Relative Path Changes

**Problem:** Import paths changed

**Solution:** Update imports to point to new location

```javascript
// Before
import './components/simulation-launcher.js';

// After
import './components/simulation-launcher/simulation-launcher.js';
```

---

## 🎓 Learning Path

For developers new to the modular architecture:

1. **Start with the main file:**  
   `simulation-launcher/simulation-launcher.js` - See how modules are orchestrated

2. **Understand business logic:**  
   `utils/validators.js` - See how validation works  
   `utils/error-handler.js` - See how errors are processed

3. **Review HTTP handling:**  
   `utils/api-client.js` - See how requests are made

4. **Explore templates:**  
   `templates/html-template.js` - See how HTML is generated  
   `templates/style-loader.js` - See how CSS is loaded

5. **Customize styles:**  
   `styles/*.css` - Modify individual style files

6. **Read documentation:**  
   `ARCHITECTURE.md` - Complete architecture guide  
   `QUICKSTART.md` - Quick reference

---

## 🔗 Side-by-Side Comparison

### Launching a Simulation

**Both versions (identical API):**
```javascript
const launcher = document.querySelector('simulation-launcher');
await launcher.launch();
```

### Setting Parameters

**Both versions (identical API):**
```javascript
launcher.setParameters({ p1: '20', q1: '30', r1: '5' });
```

### Getting Parameters

**Both versions (identical API):**
```javascript
const params = launcher.getParameters();
console.log(params); // { p1: '20', q1: '30', r1: '5' }
```

### Resetting

**Both versions (identical API):**
```javascript
launcher.reset();
```

---

## 📊 File Size Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total LOC | 663 | ~800 | +20% |
| Largest file | 663 lines | 300 lines | -55% |
| Number of files | 1 | 13 | +1200% |
| CSS in JS | 200 lines | 0 lines | -100% |
| Testable modules | 0 | 7 | ∞ |
| Separation level | Low | High | ✅ |

**Note:** While total lines increased slightly, maintainability and testability improved dramatically.

---

## 🚦 Rollback Plan

If you need to rollback:

1. **Keep the old file:**  
   Don't delete `components/simulation-launcher.js` immediately

2. **Test thoroughly:**  
   Test the new modular version in a dev environment first

3. **Gradual migration:**  
   Migrate one page at a time

4. **Easy rollback:**  
   Just change the import path back

```html
<!-- Rollback: Change this -->
<script type="module" src="./components/simulation-launcher/simulation-launcher.js"></script>

<!-- Back to this -->
<script src="./components/simulation-launcher.js"></script>
```

---

## ✅ Migration Checklist

- [ ] Read this migration guide
- [ ] Review ARCHITECTURE.md
- [ ] Update HTML imports to use `type="module"`
- [ ] Update import paths if needed
- [ ] Test in development environment
- [ ] Verify all features work
- [ ] Test in all target browsers
- [ ] Update any build scripts
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] (Optional) Remove old file after successful migration

---

## 🆘 Troubleshooting

### Problem: "Module not found"
**Solution:** Check import paths are correct and server is running

### Problem: "CORS error"
**Solution:** Use a local server, not `file://` protocol

### Problem: "Unexpected token import"
**Solution:** Add `type="module"` to script tag

### Problem: "Component not defined"
**Solution:** Ensure module is loaded before trying to use component

### Problem: "Styles not loading"
**Solution:** Check all CSS files exist in `styles/` directory

---

## 📞 Support

Need help with migration?

1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation
2. Review [QUICKSTART.md](./QUICKSTART.md) for quick reference
3. Run unit tests to verify modules work: `tests/unit-tests.js`
4. Check browser console for errors
5. Create a GitHub issue if problems persist

---

## 🎉 Success Criteria

Migration is successful when:

- ✅ No console errors
- ✅ All features work as before
- ✅ Styles look identical
- ✅ Performance is same or better
- ✅ Tests pass
- ✅ Team can work on separate modules
- ✅ Code is easier to understand
- ✅ Ready for future enhancements

---

**Happy Migrating! 🚀**

The modular architecture will make your codebase more maintainable, testable, and scalable for future development.

