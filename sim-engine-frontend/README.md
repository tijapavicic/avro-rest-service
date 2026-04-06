# Simulation Engine Frontend - UI Improvements

**Updated:** April 7, 2026  
**Version:** 2.0  
**Features:** Parameter Table, Progress Bar, Pastel Palette  

---

## 🎨 New Features

### 1. **Editable Parameter Table**

Three simulation parameters with editable text fields:

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| **p1** | 10.5 | Primary coefficient |
| **q1** | 25.0 | Quality factor |
| **r1** | 3.14 | Rate constant |

**Features:**
- ✅ Real-time value updates
- ✅ Number input with decimal precision
- ✅ Hover effects and focus states
- ✅ Pastel purple labels (#E0BBE4)
- ✅ Blue border highlights (#4f8ef7)

### 2. **Progress Bar**

Dynamic progress tracking with color-coded stages:

| Progress | Color | Status |
|----------|-------|--------|
| 0-33% | Blue (#4f8ef7) | Initializing/Sending |
| 34-66% | Pastel Peach (#FFD8B8) | Processing |
| 67-100% | Pastel Green (#C1E1C1) | Complete |

**States:**
- **0%** - Initializing...
- **20%** - Sending request...
- **50%** - Processing...
- **100%** - Complete!

### 3. **Enhanced Visual Design**

**Pastel Color Palette Integration:**
- 🔵 **Pastel Blue** (#B4D7E8) - Section headers
- 🟢 **Pastel Green** (#C1E1C1) - Success states
- 🔴 **Pastel Pink** (#FFB3BA) - Error states
- 🟠 **Pastel Peach** (#FFD8B8) - Processing states
- 🟣 **Pastel Purple** (#E0BBE4) - Parameter labels

---

## 📊 Component Structure

```
simulation-launcher (Web Component)
├── Parameter Table Section
│   ├── Header: "📊 Simulation Parameters"
│   └── 3-column table
│       ├── Parameter name (monospace, purple)
│       ├── Editable input field (number)
│       └── Description (muted)
│
├── Progress Bar Section
│   ├── Progress fill (animated, color-coded)
│   └── Progress text (centered, shadowed)
│
├── Button Section
│   └── Launch Simulation button
│
├── Status Section
│   └── Badge + Job ID
│
└── Result Section
    └── JSON response (collapsible)
```

---

## 🚀 Usage

### Basic Usage

```html
<simulation-launcher 
  backend-url="https://localhost:8082/api/simulations"
  system-id="SYS-001">
</simulation-launcher>
```

### With Custom Parameters

```javascript
// Access the component
const launcher = document.querySelector('simulation-launcher');

// Set custom parameter values
launcher.parameters = {
  p1: '15.5',
  q1: '30.0',
  r1: '2.71'
};
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `backend-url` | String | `https://localhost:8082/api/simulations` | API endpoint |
| `system-id` | String | `SYS-001` | System identifier |

---

## 📡 API Request Format

When you click "Launch Simulation", the component sends:

```json
{
  "systemId": "SYS-001",
  "requestedAt": "2026-04-07T10:30:00.000Z",
  "parameters": {
    "p1": 10.5,
    "q1": 25.0,
    "r1": 3.14
  }
}
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
X-Correlation-Id: <uuid>
```

---

## 🎯 Expected API Response

```json
{
  "jobId": "job-abc123",
  "status": "SUBMITTED",
  "systemId": "SYS-001",
  "parameters": {
    "p1": 10.5,
    "q1": 25.0,
    "r1": 3.14
  },
  "submittedAt": "2026-04-07T10:30:00.000Z"
}
```

---

## 🔒 Security Updates

### HTTPS Everywhere

All URLs now use HTTPS:
- ✅ Default backend URL: `https://localhost:8082`
- ✅ Development requires HTTPS setup (see [HTTPS-EVERYWHERE.md](../documentation/diagrams/HTTPS-EVERYWHERE.md))

### Development HTTPS Setup

**Option 1: mkcert (Recommended)**

```bash
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

**Option 2: Caddy**

```bash
brew install caddy

cat > Caddyfile <<EOF
localhost:8082 {
    reverse_proxy http://localhost:8080
    tls internal
}
EOF

caddy run
```

---

## 🎨 Styling Details

### Color Variables

```css
:root {
  --color-bg:       #0f1117;
  --color-surface:  #1a1d27;
  --color-border:   #2e3347;
  --color-accent:   #4f8ef7;
  --color-success:  #C1E1C1;  /* Pastel Green */
  --color-error:    #FFB3BA;  /* Pastel Pink */
  --color-warning:  #FFD8B8;  /* Pastel Peach */
  --color-info:     #B4D7E8;  /* Pastel Blue */
}
```

### Component Dimensions

- Card padding: `2rem 2.5rem`
- Table cell padding: `0.75rem 1rem`
- Input field max-width: `150px`
- Progress bar height: `32px`
- Button min-width: `200px`

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Parameter values update on input change
- [ ] Progress bar animates from 0% to 100%
- [ ] Progress bar colors change (blue → peach → green)
- [ ] Button disables during request
- [ ] Success badge shows "SUBMITTED" or status
- [ ] Error badge shows on failure
- [ ] JSON result displays with syntax highlighting
- [ ] Table rows highlight on hover
- [ ] Input fields focus with blue glow

### Test Scenarios

**1. Successful Submission**
```bash
# Start mock backend
npm install -g json-server
echo '{"jobId":"test-123","status":"SUBMITTED"}' > db.json
json-server --watch db.json --port 8082 --https
```

**2. Parameter Validation**
- Enter negative values
- Enter very large values
- Enter decimal values
- Leave fields empty

**3. Error Handling**
- Backend offline
- Network timeout
- Invalid JSON response
- 4xx/5xx HTTP errors

---

## 📱 Responsive Design

The component is responsive and works on:

- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667+)

### Breakpoints

- Hero max-width: `720px` (increased to accommodate table)
- Table adapts to container width
- Inputs scale with container
- Progress bar is 100% width

---

## 🔧 Customization

### Change Default Parameters

Edit in `simulation-launcher.js`:

```javascript
constructor() {
  super();
  this.parameters = {
    p1: '20.0',  // Your default
    q1: '40.0',  // Your default
    r1: '5.00'   // Your default
  };
}
```

### Add More Parameters

1. Update `parameters` object
2. Add table row in `_render()`
3. Add event listener in `_attachEventListeners()`

Example for `s1`:

```html
<tr>
  <td><span class="param-name">s1</span></td>
  <td><input type="number" id="param-s1" class="param-input" value="1.0" /></td>
  <td style="color: #94a3b8;">Scale factor</td>
</tr>
```

```javascript
this.parameters.s1 = '1.0';
```

### Customize Progress Messages

Edit `_launch()` method:

```javascript
this._updateProgress(20, 'Custom message...');
```

---

## 📂 File Structure

```
sim-engine-frontend/
├── index.html                      # Main HTML (updated with HTTPS)
├── style.css                       # Global styles (pastel palette)
├── components/
│   └── simulation-launcher.js      # Web Component (enhanced)
└── README.md                       # This file
```

---

## 🔄 Migration from v1.0

### Breaking Changes

**None** - Fully backward compatible!

### New Features

- Parameter table automatically appears
- Progress bar shows during requests
- Backend URL must use HTTPS (security best practice)

### Upgrade Steps

1. Replace `simulation-launcher.js` with new version
2. Update `backend-url` to use HTTPS
3. Configure HTTPS for localhost (see Security section)
4. Test parameter editing and progress bar

---

## 🐛 Troubleshooting

### Progress Bar Not Showing

**Cause:** Progress bar only shows during active requests  
**Fix:** Click "Launch Simulation" button

### Parameters Not Sending

**Cause:** Values not parsed as numbers  
**Fix:** Check `parseFloat()` conversion in `_launch()`

### HTTPS Certificate Errors

**Cause:** Self-signed certificates not trusted  
**Fix:** Use `mkcert` or add exception in browser

### Input Fields Not Updating

**Cause:** Event listeners not attached  
**Fix:** Check `_attachEventListeners()` is called in `connectedCallback()`

---

## 📖 Related Documentation

- [Keycloak Auth Flow Diagrams](../documentation/keycloak-auth-flow-diagrams.md)
- [HTTPS Everywhere Guide](../documentation/diagrams/HTTPS-EVERYWHERE.md)
- [Color Palette Guide](../documentation/diagrams/COLOR-PALETTE.md)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

---

## 🎉 Features Summary

✅ **Editable parameter table** (p1, q1, r1)  
✅ **Animated progress bar** with color stages  
✅ **Pastel color palette** integration  
✅ **HTTPS everywhere** security  
✅ **Enhanced error handling**  
✅ **Improved visual design**  
✅ **Responsive layout**  
✅ **Zero breaking changes**  

---

**Version:** 2.0  
**Status:** Production Ready  
**Updated:** April 7, 2026  

🚀 **Enhanced UI with progress tracking and editable parameters!**

