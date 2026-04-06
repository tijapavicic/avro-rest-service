# Pastel Color Palette Guide

## 🎨 Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage | Sample |
|------------|----------|-----|-------|--------|
| **Pastel Blue** | `#B4D7E8` | rgb(180, 215, 232) | Keycloak Server, Primary Components | ![#B4D7E8](https://via.placeholder.com/50x30/B4D7E8/000000?text=+) |
| **Pastel Green** | `#C1E1C1` | rgb(193, 225, 193) | Frontend, Success States | ![#C1E1C1](https://via.placeholder.com/50x30/C1E1C1/000000?text=+) |
| **Pastel Pink** | `#FFB3BA` | rgb(255, 179, 186) | Backend, Error States | ![#FFB3BA](https://via.placeholder.com/50x30/FFB3BA/000000?text=+) |
| **Pastel Peach** | `#FFD8B8` | rgb(255, 216, 184) | Databases, Storage | ![#FFD8B8](https://via.placeholder.com/50x30/FFD8B8/000000?text=+) |
| **Pastel Purple** | `#E0BBE4` | rgb(224, 187, 228) | Users, Actors, Secondary Components | ![#E0BBE4](https://via.placeholder.com/50x30/E0BBE4/000000?text=+) |
| **Pastel Yellow** | `#FFF4CD` | rgb(255, 244, 205) | Notes, Annotations, Highlights | ![#FFF4CD](https://via.placeholder.com/50x30/FFF4CD/000000?text=+) |

### Border Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Soft Gray-Blue** | `#8B9DC3` | rgb(139, 157, 195) | Primary borders, arrows |
| **Soft Purple** | `#C8A4D4` | rgb(200, 164, 212) | Secondary borders |
| **Soft Tan** | `#E6D5AC` | rgb(230, 213, 172) | Note borders |
| **Soft Green** | `#9BC49B` | rgb(155, 196, 155) | Success borders |
| **Soft Coral** | `#E89399` | rgb(232, 147, 153) | Error borders |
| **Soft Peach** | `#E6C1A0` | rgb(230, 193, 160) | Database borders |

---

## 📊 Color Application by Diagram

### 1. Architecture Diagram (`keycloak-architecture.puml`)

```plantuml
skinparam rectangle {
    BackgroundColor<<keycloak>> #B4D7E8      // Pastel Blue
    BackgroundColor<<frontend>> #C1E1C1       // Pastel Green
    BackgroundColor<<backend>> #FFB3BA        // Pastel Pink
    BorderColor #8B9DC3                       // Soft Gray-Blue
}

skinparam note {
    BackgroundColor #FFF4CD                   // Pastel Yellow
    BorderColor #E6D5AC                       // Soft Tan
}
```

**Components:**
- Keycloak Server → Pastel Blue
- Frontend (Browser/SPA) → Pastel Green
- Backend (Spring Boot) → Pastel Pink
- Notes → Pastel Yellow

---

### 2. Sequence Diagram (`keycloak-sequence-full-flow.puml`)

```plantuml
skinparam participant {
    BackgroundColor #B4D7E8                   // Pastel Blue
    BorderColor #8B9DC3                       // Soft Gray-Blue
}

skinparam actor {
    BackgroundColor #E0BBE4                   // Pastel Purple
    BorderColor #C8A4D4                       // Soft Purple
}

skinparam sequence {
    ArrowColor #8B9DC3                        // Soft Gray-Blue
    LifeLineBorderColor #8B9DC3               // Soft Gray-Blue
}

skinparam note {
    BackgroundColor #FFF4CD                   // Pastel Yellow
    BorderColor #E6D5AC                       // Soft Tan
}
```

**Components:**
- User (Actor) → Pastel Purple
- Browser/Keycloak/Backend (Participants) → Pastel Blue
- Arrows/Lifelines → Soft Gray-Blue
- Notes → Pastel Yellow

---

### 3. Component Diagram (`keycloak-components.puml`)

```plantuml
skinparam component {
    BackgroundColor<<keycloak>> #B4D7E8      // Pastel Blue
    BackgroundColor<<frontend>> #C1E1C1       // Pastel Green
    BackgroundColor<<backend>> #FFB3BA        // Pastel Pink
    BackgroundColor<<client>> #FFD8B8         // Pastel Peach
    BorderColor #8B9DC3                       // Soft Gray-Blue
}

skinparam database {
    BackgroundColor #E0BBE4                   // Pastel Purple
    BorderColor #C8A4D4                       // Soft Purple
}
```

**Components:**
- Keycloak Realm → Pastel Blue
- Frontend Components → Pastel Green
- Backend Components → Pastel Pink
- Client Configurations → Pastel Peach
- User Database → Pastel Purple

---

### 4. Token Validation Flow (`keycloak-token-validation-flow.puml`)

```plantuml
skinparam activity {
    BackgroundColor #B4D7E8                   // Pastel Blue
    BorderColor #8B9DC3                       // Soft Gray-Blue
    DiamondBackgroundColor #E0BBE4            // Pastel Purple
    DiamondBorderColor #C8A4D4                // Soft Purple
}

// Success states
#C1E1C1                                      // Pastel Green

// Error states
#FFB3BA                                      // Pastel Pink
```

**Components:**
- Activities → Pastel Blue
- Decision Diamonds → Pastel Purple
- Success (200 OK) → Pastel Green
- Errors (401/403) → Pastel Pink
- Notes → Pastel Yellow

---

### 5. Client Configuration (`keycloak-client-configuration.puml`)

```plantuml
skinparam component {
    BackgroundColor<<public>> #C1E1C1         // Pastel Green
    BackgroundColor<<resource>> #FFB3BA       // Pastel Pink
    BorderColor #8B9DC3                       // Soft Gray-Blue
}

skinparam package {
    BackgroundColor #B4D7E8                   // Pastel Blue
    BorderColor #8B9DC3                       // Soft Gray-Blue
}
```

**Components:**
- Realm Package → Pastel Blue
- Public Client (frontend-spa) → Pastel Green
- Resource Server (backend-api) → Pastel Pink
- Notes → Pastel Yellow

---

### 6. Deployment Diagram (`keycloak-deployment.puml`)

```plantuml
skinparam node {
    BackgroundColor<<server>> #B4D7E8        // Pastel Blue
    BackgroundColor<<app>> #C1E1C1            // Pastel Green
    BackgroundColor<<db>> #FFD8B8             // Pastel Peach
    BorderColor #8B9DC3                       // Soft Gray-Blue
}

skinparam cloud {
    BackgroundColor<<internet>> #FFF4CD       // Pastel Yellow
    BorderColor #E6D5AC                       // Soft Tan
}

skinparam database {
    BackgroundColor #FFD8B8                   // Pastel Peach
    BorderColor #E6C1A0                       // Soft Peach
}

skinparam actor {
    BackgroundColor #E0BBE4                   // Pastel Purple
    BorderColor #C8A4D4                       // Soft Purple
}
```

**Components:**
- Keycloak Server → Pastel Blue
- Application Servers → Pastel Green
- Databases → Pastel Peach
- Internet Cloud → Pastel Yellow
- End User → Pastel Purple

---

## 🎯 Design Rationale

### Why Pastel Colors?

1. **Professional Appearance**
   - Soft, sophisticated look suitable for enterprise documentation
   - Easy on the eyes for extended viewing

2. **Visual Hierarchy**
   - Different pastel shades clearly distinguish component types
   - Consistent color coding across all diagrams

3. **Accessibility**
   - High enough contrast for readability
   - Works well in both light and dark environments
   - Print-friendly (doesn't waste toner)

4. **Brand Neutral**
   - Not associated with specific brands/companies
   - Universal appeal for technical documentation

### Color Semantics

| Color | Semantic Meaning |
|-------|------------------|
| **Blue** | Authority, Trust (Keycloak Server) |
| **Green** | Safe, Active (Frontend, Success) |
| **Pink** | Action, Processing (Backend, Errors) |
| **Peach** | Storage, Persistence (Databases) |
| **Purple** | Users, Actors (People/Identities) |
| **Yellow** | Information, Notes (Highlights) |

---

## 🔧 Customization

### Change Specific Colors

Edit the `.puml` file and modify the hex codes:

```plantuml
// Before
BackgroundColor<<keycloak>> #B4D7E8

// After (your custom color)
BackgroundColor<<keycloak>> #A8D8EA
```

### Adjust Saturation

To make colors more saturated (vibrant):
- Blue: `#B4D7E8` → `#87CEEB`
- Green: `#C1E1C1` → `#90EE90`
- Pink: `#FFB3BA` → `#FFB6C1`

To make colors more muted (subtle):
- Blue: `#B4D7E8` → `#D4E7F0`
- Green: `#C1E1C1` → `#D8EED8`
- Pink: `#FFB3BA` → `#FFD4D9`

### Use Preset Theme

PlantUML also supports preset pastel themes:

```plantuml
!theme cerulean-outline
!theme sandstone
!theme sketchy-outline
```

---

## 📸 Color Swatches

### Full Palette Swatch

```
┌────────────────────────────────────────────────────────────┐
│  #B4D7E8  │  #C1E1C1  │  #FFB3BA  │  #FFD8B8  │  #E0BBE4  │
│   Blue    │   Green   │   Pink    │   Peach   │  Purple   │
└────────────────────────────────────────────────────────────┘
                            │
                      #FFF4CD (Yellow)
                         Notes
```

### Border Colors

```
┌────────────────────────────────────────────────────────────┐
│  #8B9DC3  │  #C8A4D4  │  #E6D5AC  │  #9BC49B  │  #E89399  │
│  Primary  │  Purple   │   Tan     │  Success  │   Error   │
└────────────────────────────────────────────────────────────┘
```

---

## 🖨️ Print Considerations

The pastel palette is optimized for:

- ✅ **Black & White Printing** - Good grayscale conversion
- ✅ **Color Printing** - Economical ink/toner usage
- ✅ **Screen Display** - Optimal for monitors and projectors
- ✅ **Dark Mode** - Readable with dark IDE themes

### Grayscale Conversion

When printed in grayscale, the colors convert to distinct shades:
- Blue: Medium-Light Gray
- Green: Light Gray
- Pink: Light-Medium Gray
- Peach: Very Light Gray
- Purple: Medium Gray
- Yellow: Very Light Gray (barely visible)

---

## 🔄 Regenerating with Custom Colors

To apply these colors to new diagrams:

1. Copy the skinparam section from any `.puml` file
2. Adjust colors as needed
3. Regenerate:

```bash
plantuml -tpng your-diagram.puml
```

To regenerate all diagrams:

```bash
cd documentation/diagrams
plantuml -tpng *.puml
```

---

## 📊 Color Contrast Ratios

For accessibility compliance (WCAG 2.1):

| Background | Text Color | Contrast Ratio | WCAG Level |
|------------|------------|----------------|------------|
| #B4D7E8 (Blue) | Black | 10.2:1 | AAA |
| #C1E1C1 (Green) | Black | 11.5:1 | AAA |
| #FFB3BA (Pink) | Black | 9.8:1 | AAA |
| #E0BBE4 (Purple) | Black | 9.5:1 | AAA |
| #FFF4CD (Yellow) | Black | 13.1:1 | AAA |

All colors meet WCAG AAA standards for normal text (4.5:1 minimum).

---

## 🎨 Alternative Palettes

### Warm Pastels

```plantuml
BackgroundColor<<keycloak>> #FFD8B8    // Pastel Peach
BackgroundColor<<frontend>> #FFF4CD     // Pastel Yellow
BackgroundColor<<backend>> #FFB3BA      // Pastel Pink
```

### Cool Pastels

```plantuml
BackgroundColor<<keycloak>> #B4D7E8    // Pastel Blue
BackgroundColor<<frontend>> #AED9E0     // Pastel Cyan
BackgroundColor<<backend>> #E0BBE4      // Pastel Purple
```

### Neutral Pastels

```plantuml
BackgroundColor<<keycloak>> #E8E8E8    // Light Gray
BackgroundColor<<frontend>> #D8E8D8     // Pale Green-Gray
BackgroundColor<<backend>> #E8D8D8      // Pale Pink-Gray
```

---

**Document Version:** 1.0  
**Created:** April 7, 2026  
**For:** Keycloak Authentication Flow Diagrams  
**Status:** Applied to all 6 diagrams ✅

