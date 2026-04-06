# 🧪 Quick Test Reference Card

## Run Tests

```bash
npm test                 # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

## Test Files

| File | Module | Tests |
|------|--------|-------|
| `validators.test.js` | ParameterValidator | 40+ |
| `error-handler.test.js` | ErrorHandler | 45+ |
| `progress-manager.test.js` | ProgressManager | 50+ |
| `api-client.test.js` | ApiClient | 45+ |
| `integration.test.js` | SimulationLauncher | 35+ |

## Coverage

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

**Target: 70%+ across all metrics**

## Status

✅ 215+ tests  
✅ 2000+ lines  
✅ 5 test suites  
✅ Jest configured  
✅ CI/CD ready  

## Docs

- `TEST-DOCUMENTATION.md` - Full guide
- `UNIT-TESTS-SUMMARY.md` - Overview
- `TESTING.md` - Manual + automated

---

**Quick Start:**
```bash
cd sim-engine-frontend
npm install
npm test
```

