# Analytics & Settings Implementation Guide

## 🎯 Overview

The Sim Engine frontend now includes fully functional **Analytics** and **Settings** pages with modern glassmorphism design.

---

## ✨ Features Implemented

### 1. **Analytics Dashboard**

**Real-time simulation metrics and statistics:**

- ✅ **Statistics Cards**
  - Total submissions count
  - Success rate percentage
  - Average response time
  - Failed submissions count

- ✅ **Visual Charts**
  - Status distribution (bar chart)
  - Hourly activity (line chart)
  - Current hour indicator

- ✅ **Recent Jobs Table**
  - Last 10 simulations
  - Job ID, status, system ID
  - Response time, timestamp
  - Color-coded status badges

- ✅ **Data Persistence**
  - Stored in localStorage
  - Survives page refreshes
  - Automatic tracking

### 2. **Settings Panel**

**Comprehensive configuration options:**

- ✅ **API Configuration**
  - Backend endpoint URL
  - System ID
  - Request timeout

- ✅ **Default Parameters**
  - P1, Q1, R1 defaults
  - Validation ranges
  - Applied on reset

- ✅ **Preferences**
  - Enable/disable analytics
  - Browser notifications
  - Auto-refresh dashboard
  - Refresh interval

- ✅ **Advanced Settings**
  - Debug mode
  - Verbose logging
  - Retry failed requests
  - Max retry attempts

- ✅ **Danger Zone**
  - Clear analytics data
  - Confirmation dialogs

### 3. **View Router**

**Seamless navigation:**

- ✅ URL hash-based routing (`#dashboard`, `#analytics`, `#settings`)
- ✅ Browser back/forward button support
- ✅ Active state management
- ✅ Smooth view transitions

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `components/view-router.js` | Navigation & view management |
| `components/analytics-manager.js` | Analytics tracking & visualization |
| `components/settings-manager.js` | Settings management & persistence |
| `analytics-settings.css` | Styles for new features |
| `ANALYTICS-SETTINGS-GUIDE.md` | This documentation |

---

## 🚀 How to Use

### Access the Features

1. **Start the frontend:**
   ```bash
   cd /Users/copor/CodexProjects/avro-rest-service/sim-engine-frontend
   npm start
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

3. **Navigate:**
   - **Dashboard** - Submit simulations (default view)
   - **Analytics** - View statistics and charts
   - **Settings** - Configure application

### View Analytics

1. Click **"Analytics"** in the navigation
2. View real-time statistics
3. Check charts for trends
4. Review recent jobs table
5. Click **"Refresh"** to update data

### Configure Settings

1. Click **"Settings"** in the navigation
2. Modify any setting
3. Click **"Save Changes"**
4. Settings apply immediately

---

## 📊 Analytics Data Structure

Analytics data is stored in `localStorage` under key `sim-analytics-data`:

```json
{
  "totalSubmissions": 15,
  "successfulSubmissions": 12,
  "failedSubmissions": 3,
  "averageResponseTime": 245.5,
  "statusDistribution": {
    "SUBMITTED": 8,
    "PROCESSING": 2,
    "COMPLETED": 2,
    "FAILED": 3
  },
  "hourlyActivity": [0, 0, 1, 2, 5, ...],
  "recentJobs": [
    {
      "jobId": "JOB-123456",
      "status": "SUBMITTED",
      "timestamp": "2026-04-07T12:00:00Z",
      "responseTime": 234,
      "systemId": "SYS-001"
    }
  ],
  "lastUpdated": "2026-04-07T12:05:30Z"
}
```

### Automatic Tracking

Analytics automatically records:
- ✅ Every simulation submission (success/failure)
- ✅ Response times in milliseconds
- ✅ Status distribution
- ✅ Hourly activity patterns
- ✅ Recent job history

### Manual Actions

- **Refresh**: Click refresh button to update display
- **Clear**: Settings → Danger Zone → Clear Data

---

## ⚙️ Settings Configuration

Settings are stored in `localStorage` under key `sim-settings`:

```json
{
  "apiEndpoint": "http://localhost:8082/api/simulations",
  "systemId": "SYS-001",
  "timeout": 10000,
  "theme": "dark",
  "enableAnalytics": true,
  "enableNotifications": true,
  "autoRefresh": false,
  "refreshInterval": 30,
  "defaultParameters": {
    "p1": "10.5",
    "q1": "25.0",
    "r1": "3.14"
  },
  "advanced": {
    "enableDebugMode": false,
    "enableVerboseLogging": false,
    "retryFailedRequests": true,
    "maxRetries": 3
  }
}
```

### Settings Effects

| Setting | Effect |
|---------|--------|
| **API Endpoint** | Changes backend URL for requests |
| **System ID** | Default system identifier in payloads |
| **Timeout** | Max wait time for API responses |
| **Enable Analytics** | Start/stop recording metrics |
| **Enable Notifications** | Browser notifications (future) |
| **Auto Refresh** | Automatically update analytics |
| **Refresh Interval** | How often to refresh (seconds) |
| **Default Parameters** | P1, Q1, R1 starting values |
| **Debug Mode** | Console logging enabled |
| **Verbose Logging** | Log all API calls |
| **Retry Requests** | Auto-retry on failure |
| **Max Retries** | Retry attempt limit |

---

## 🎨 Design Features

### Modern Glassmorphism

All new components use the same design system:

- **Semi-transparent backgrounds** with backdrop blur
- **Gradient accents** (blue to purple)
- **Smooth animations** on all interactions
- **Hover effects** with lift and glow
- **Responsive grid layouts**

### Color-Coded Status

- **SUBMITTED** - Blue gradient
- **PROCESSING** - Yellow gradient
- **COMPLETED** - Green gradient
- **FAILED** - Red gradient

### Interactive Charts

- **Bar Chart**: Status distribution with color coding
- **Line Chart**: 24-hour activity with current hour indicator
- **Canvas-based**: Smooth, performant rendering

---

## 🔧 Advanced Usage

### Programmatic Access

```javascript
// Access managers globally
window.analyticsManager
window.settingsManager
window.router

// Navigate programmatically
router.navigateTo('analytics');

// Get statistics
const stats = analyticsManager.getStats();
console.log(stats);

// Modify settings
settingsManager.settings.apiEndpoint = 'https://new-api.com';
settingsManager.saveSettings();

// Record custom event
analyticsManager.recordSubmission({
  jobId: 'CUSTOM-123',
  status: 'SUBMITTED'
}, 500, true);
```

### Custom Events

**Listen for settings changes:**

```javascript
window.addEventListener('settings-changed', (event) => {
  console.log('New settings:', event.detail);
});
```

**Manually trigger analytics update:**

```javascript
document.dispatchEvent(new CustomEvent('simulation-submitted', {
  detail: {
    jobData: { jobId: 'TEST', status: 'SUBMITTED' },
    responseTime: 250,
    success: true
  }
}));
```

---

## 📈 Analytics Calculations

### Success Rate
```
Success Rate = (Successful Submissions / Total Submissions) × 100
```

### Average Response Time
```
New Avg = ((Old Avg × Old Count) + New Time) / New Count
```

### Hourly Activity
```
Activity[Hour] = Count of submissions in that hour
```

---

## 🛡️ Data Privacy

- ✅ **All data stored locally** in browser localStorage
- ✅ **No external tracking** or analytics services
- ✅ **User-controlled** - can be cleared anytime
- ✅ **No personal information** collected
- ✅ **Transparent** - view data in browser DevTools

### View Stored Data

Open browser DevTools Console:

```javascript
// View analytics data
JSON.parse(localStorage.getItem('sim-analytics-data'))

// View settings
JSON.parse(localStorage.getItem('sim-settings'))

// Clear all data
localStorage.clear()
```

---

## 🎯 Use Cases

### 1. **Performance Monitoring**

Track response times over different times of day:
1. Navigate to Analytics
2. Check "Hourly Activity" chart
3. Identify peak/slow periods

### 2. **Success Rate Tracking**

Monitor submission reliability:
1. View "Success Rate" stat card
2. Check recent jobs for patterns
3. Investigate failed submissions

### 3. **Custom Backend**

Point to different API:
1. Go to Settings
2. Change "API Endpoint"
3. Save changes
4. Test in Dashboard

### 4. **Parameter Tuning**

Set different defaults:
1. Go to Settings
2. Update Default Parameters
3. Save changes
4. Dashboard uses new defaults

---

## 🔍 Troubleshooting

### Analytics not recording

**Issue:** Submissions not appearing in analytics

**Solutions:**
1. Check Settings → Enable Analytics is ON
2. Verify localStorage is enabled in browser
3. Check browser console for errors
4. Try clearing data and retry

### Settings not saving

**Issue:** Settings reset on page refresh

**Solutions:**
1. Check localStorage is enabled
2. Verify no browser extensions blocking storage
3. Check browser console for quota errors
4. Try incognito mode

### Charts not displaying

**Issue:** Empty or broken charts

**Solutions:**
1. Submit at least one simulation
2. Click refresh button
3. Check browser console for canvas errors
4. Verify canvas is supported

---

## 🚀 Future Enhancements

Potential additions:

- [ ] Export analytics to CSV/JSON
- [ ] Custom date range filtering
- [ ] More chart types (pie, scatter)
- [ ] Real-time WebSocket updates
- [ ] Custom themes (light mode)
- [ ] Browser notifications
- [ ] Advanced filtering
- [ ] Comparison views
- [ ] PDF report generation
- [ ] API health monitoring

---

## 📚 Related Documentation

- `README.md` - Main project documentation
- `MODERN-DESIGN-SUMMARY.md` - Design system guide
- `TESTING.md` - Testing guide
- `how-to-run-me.md` - Running instructions

---

## ✅ Summary

### What Was Built

✅ **Analytics Dashboard** with real-time charts and statistics  
✅ **Settings Panel** with comprehensive configuration  
✅ **View Router** with hash-based navigation  
✅ **Data Persistence** using localStorage  
✅ **Modern Design** matching existing glassmorphism  
✅ **Fully Functional** navigation and state management  
✅ **Event System** for automatic analytics tracking  
✅ **Responsive** design for all screen sizes  

### Key Features

- 📊 Visual analytics with charts
- ⚙️ Comprehensive settings
- 🔄 Automatic data collection
- 💾 Persistent storage
- 🎨 Modern glassmorphism design
- 📱 Mobile responsive
- ♿ Accessible
- 🚀 Production ready

---

**Status:** ✅ Complete and Production Ready  
**Last Updated:** April 7, 2026  
**Version:** 1.0.0

