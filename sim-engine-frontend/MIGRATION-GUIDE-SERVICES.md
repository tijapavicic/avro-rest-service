# Migration Guide - From Managers to Services

## 🎯 Purpose

This guide helps migrate from the old manager-based architecture to the new service-oriented architecture.

---

## 📋 Quick Migration Checklist

- [ ] Replace manager imports with service imports
- [ ] Update event names to use namespaces
- [ ] Replace direct DOM manipulation with event bus
- [ ] Update localStorage access to use StorageService
- [ ] Test all functionality
- [ ] Update tests

---

## 🔄 Code Changes Required

### 1. **Analytics Migration**

**OLD CODE:**
```javascript
// Old manager instance
window.analyticsManager = new AnalyticsManager();

// Direct method calls
analyticsManager.recordSubmission(jobData, time, success);
analyticsManager.refresh();
analyticsManager.clearData();
```

**NEW CODE:**
```javascript
// Import service
import analyticsService from './services/analytics-service.js';

// Use via event bus (preferred)
eventBus.emit('analytics:record', { jobData, responseTime, success });
eventBus.emit('analytics:refresh');
eventBus.emit('analytics:clear');

// Or direct method calls
analyticsService.recordSubmission(jobData, time, success);
analyticsService.refresh();
analyticsService.clearData();
```

### 2. **Settings Migration**

**OLD CODE:**
```javascript
window.settingsManager = new SettingsManager();

// Direct property access
settingsManager.settings.apiEndpoint = 'https://...';
settingsManager.saveSettings();
```

**NEW CODE:**
```javascript
import settingsService from './services/settings-service.js';

// Validated updates
const result = settingsService.updateSettings({
  apiEndpoint: 'https://...'
});

if (!result.success) {
  console.error('Validation errors:', result.errors);
}

// Immutable access
const settings = settingsService.getSettings();
const endpoint = settingsService.getSetting('apiEndpoint');
```

### 3. **Router Migration**

**OLD CODE:**
```javascript
window.router = new ViewRouter();
router.registerView('dashboard', element);
router.registerNavButton('dashboard', button);
router.navigateTo('dashboard');
```

**NEW CODE:**
```javascript
import routerService from './services/router-service.js';

// More powerful route registration
routerService.registerRoute('dashboard', {
  element: document.getElementById('dashboard-view'),
  title: 'Dashboard - Sim Engine Pro',
  guard: async () => {
    // Optional: Check authentication
    return true;
  },
  onEnter: async (params) => {
    // Optional: Initialize view
    console.log('Entering dashboard');
  },
  onLeave: async () => {
    // Optional: Cleanup
    console.log('Leaving dashboard');
  }
});

// Navigate
routerService.navigateTo('dashboard');

// Use middleware
routerService.use(async (route, params) => {
  console.log(`Navigating to ${route.name}`);
  return true; // Allow navigation
});
```

### 4. **Event Communication**

**OLD CODE:**
```javascript
// Direct event dispatch
document.dispatchEvent(new CustomEvent('simulation-submitted', {
  detail: { jobData, responseTime, success }
}));

// Direct listener
document.addEventListener('simulation-submitted', (event) => {
  // Handle event
});
```

**NEW CODE:**
```javascript
import eventBus from './services/event-bus.js';

// Emit event (cleaner)
eventBus.emit('simulation:submitted', { jobData, responseTime, success });

// Listen to event
eventBus.on('simulation:submitted', (event) => {
  const { jobData, responseTime, success } = event.data;
  // Handle event
});

// Listen once
eventBus.once('simulation:completed', (event) => {
  // Runs only once
});

// Priority listeners
eventBus.on('simulation:submitted', handler, { priority: 10 });

// Wildcard listeners
eventBus.on('simulation:*', (event) => {
  // Handles all simulation:* events
});
```

### 5. **Storage Access**

**OLD CODE:**
```javascript
// Direct localStorage access
const data = JSON.parse(localStorage.getItem('sim-analytics-data'));
localStorage.setItem('sim-analytics-data', JSON.stringify(data));
```

**NEW CODE:**
```javascript
import storageService from './services/storage-service.js';

// With versioning and error handling
const data = storageService.get('sim-analytics-data', defaultValue);
const success = storageService.set('sim-analytics-data', data);

if (!success) {
  console.error('Failed to save data');
}

// Check storage usage
const stats = storageService.getUsageStats();
console.log(`Storage: ${stats.percentage}% used`);
```

---

## 🎯 Event Naming Conventions

Use namespace prefixes for clarity:

```javascript
// OLD (flat namespace)
'simulation-submitted'
'settings-changed'
'analytics-updated'

// NEW (namespaced)
'simulation:submitted'
'simulation:completed'
'simulation:failed'

'settings:changed'
'settings:reset'
'settings:save:failed'

'analytics:updated'
'analytics:cleared'
'analytics:error'

'router:navigated'
'router:blocked'
'router:notfound'
```

---

## ⚠️ Breaking Changes

### 1. **Settings Validation**

Settings now require validation. Invalid settings will be rejected:

```javascript
// OLD: No validation
settingsManager.settings.timeout = -1; // Accepted
settingsManager.saveSettings();

// NEW: Validated
const result = settingsService.updateSettings({ timeout: -1 });
// result.success = false
// result.errors = ['timeout must be between 1000 and 60000 ms']
```

### 2. **Immutable Settings**

Settings are now immutable by default:

```javascript
// OLD: Mutable
const settings = settingsManager.settings;
settings.apiEndpoint = 'https://...'; // Modifies original

// NEW: Immutable
const settings = settingsService.getSettings();
settings.apiEndpoint = 'https://...'; // ERROR: Cannot modify frozen object

// Correct way:
settingsService.updateSettings({ apiEndpoint: 'https://...' });
```

### 3. **Event Data Structure**

Events now use consistent structure:

```javascript
// OLD: Inconsistent
{ jobData, responseTime, success }

// NEW: Consistent
{
  name: 'simulation:submitted',
  data: { jobData, responseTime, success },
  timestamp: 1234567890,
  propagationStopped: false
}
```

---

## ✅ Testing Migration

### Unit Tests

**OLD:**
```javascript
test('should record submission', () => {
  const manager = new AnalyticsManager();
  manager.recordSubmission({ jobId: '123' }, 100, true);
  expect(manager.data.totalSubmissions).toBe(1);
});
```

**NEW:**
```javascript
import analyticsService from './services/analytics-service.js';

test('should record submission', () => {
  // Service is singleton, so reset first
  analyticsService.clearData();
  
  analyticsService.recordSubmission({ jobId: '123' }, 100, true);
  const stats = analyticsService.getStats();
  expect(stats.total).toBe(1);
});
```

### Integration Tests

**NEW EVENT-DRIVEN TESTS:**
```javascript
test('should emit event on submission', (done) => {
  eventBus.once('analytics:updated', (event) => {
    expect(event.data.stats.total).toBeGreaterThan(0);
    done();
  });
  
  analyticsService.recordSubmission({ jobId: '123' }, 100, true);
});
```

---

## 🚀 Gradual Migration Strategy

### Phase 1: Add New Services (Week 1)

1. Add service files alongside managers
2. Expose services on window for compatibility:
   ```javascript
   window.analyticsService = analyticsService;
   window.settingsService = settingsService;
   ```

### Phase 2: Update Critical Paths (Week 2)

1. Update main application logic to use services
2. Keep old managers working via facade:
   ```javascript
   // Compatibility layer
   window.analyticsManager = {
     recordSubmission: (...args) => analyticsService.recordSubmission(...args),
     refresh: () => analyticsService.refresh(),
     clearData: () => analyticsService.clearData()
   };
   ```

### Phase 3: Migrate Tests (Week 3)

1. Update unit tests
2. Update integration tests
3. Add new test cases for service features

### Phase 4: Remove Old Code (Week 4)

1. Remove old manager files
2. Remove compatibility layer
3. Clean up event listeners
4. Update documentation

---

## 📊 Compatibility Matrix

| Feature | Old Manager | New Service | Compatible? |
|---------|-------------|-------------|-------------|
| Basic CRUD | ✅ | ✅ | ✅ |
| Event Emission | ✅ | ✅ | ✅ |
| Validation | ❌ | ✅ | ⚠️ |
| Type Safety | ❌ | ✅ | ⚠️ |
| Error Handling | Basic | Advanced | ⚠️ |
| Storage Quota | ❌ | ✅ | ⚠️ |
| Middleware | ❌ | ✅ | ❌ |
| Route Guards | ❌ | ✅ | ❌ |

---

## 🔍 Verification Steps

After migration, verify:

```javascript
// 1. Check services are loaded
console.assert(window.storageService, 'StorageService not loaded');
console.assert(window.eventBus, 'EventBus not loaded');
console.assert(window.analyticsService, 'AnalyticsService not loaded');
console.assert(window.settingsService, 'SettingsService not loaded');
console.assert(window.routerService, 'RouterService not loaded');

// 2. Test basic functionality
const testSubmission = {
  jobId: 'TEST-' + Date.now(),
  status: 'SUBMITTED'
};
analyticsService.recordSubmission(testSubmission, 100, true);
console.assert(analyticsService.getStats().total > 0, 'Analytics not working');

// 3. Test settings
const result = settingsService.updateSettings({ timeout: 5000 });
console.assert(result.success, 'Settings update failed');

// 4. Test routing
routerService.navigateTo('dashboard');
console.assert(routerService.getCurrentRoute() === 'dashboard', 'Routing not working');

// 5. Test events
let eventReceived = false;
eventBus.once('test:event', () => { eventReceived = true; });
eventBus.emit('test:event');
console.assert(eventReceived, 'EventBus not working');

console.log('✅ All services verified');
```

---

## 📞 Support

If you encounter issues during migration:

1. Check the console for error messages
2. Review service documentation
3. Check event names (use namespaces)
4. Verify validation rules
5. Test with browser DevTools

---

**Migration Difficulty:** Medium  
**Estimated Time:** 2-4 weeks for full migration  
**Risk Level:** Low (backward compatible initially)  
**Benefit:** High (maintainability, scalability, testability)

