# Keycloak Authentication Flow Diagrams

## 📊 Generated Diagrams (6 Total)

### Regenerate:
```shell
cd documentation/diagrams
plantuml -tpng *.puml
```


---

## Available Diagrams

This directory contains PlantUML diagram sources for the Keycloak authentication architecture.

### 1. **keycloak-architecture.puml**
High-level architecture showing the three main components:
- Keycloak Server (Authorization Server)
- Frontend Application (Browser/SPA with Web Components)
- Backend Application (Spring Boot Resource Server)

**Use Case:** Understanding the overall system architecture and component responsibilities.

### 2. **keycloak-sequence-full-flow.puml**
Complete sequence diagram (21 steps) showing:
- Authorization Code + PKCE flow
- Token exchange
- API request with JWT validation
- Full authentication to data retrieval flow

**Use Case:** Understanding the complete authentication and API access flow.

### 3. **keycloak-components.puml**
Detailed component diagram showing:
- Keycloak realm configuration (clients, users, roles)
- Frontend Web Components architecture
- Backend Spring Security filter chain
- Component interactions

**Use Case:** Understanding internal component structure and dependencies.

### 4. **keycloak-token-validation-flow.puml**
Activity/flow diagram showing JWT validation process:
- Token extraction
- Signature verification using JWKS
- Claims validation
- Authorization checks
- Success/failure paths

**Use Case:** Debugging token validation issues, understanding security checks.

### 5. **keycloak-client-configuration.puml**
Configuration diagram showing:
- frontend-spa client settings (public client, PKCE)
- backend-api client settings (resource server, bearer-only)
- Detailed configuration parameters
- Comparison of client types

**Use Case:** Setting up Keycloak clients, understanding configuration differences.

### 6. **keycloak-deployment.puml**
Deployment architecture showing:
- Production environment layout
- Load balancer, servers, databases
- Security layers
- Network communication patterns

**Use Case:** Planning production deployment, understanding infrastructure requirements.

---

## Generating Diagrams

### Prerequisites

Install PlantUML:

```bash
# macOS (Homebrew)
brew install plantuml

# macOS (via pip)
pip install plantuml

# Ubuntu/Debian
sudo apt-get install plantuml

# Windows (Chocolatey)
choco install plantuml
```

### Generate PNG Images

```bash
# Generate all diagrams
plantuml *.puml

# Generate specific diagram
plantuml keycloak-architecture.puml

# Generate with specific format
plantuml -tsvg keycloak-architecture.puml
plantuml -tpng keycloak-sequence-full-flow.puml
plantuml -tpdf keycloak-components.puml
```

### Generate ASCII Art

```bash
# Text-based diagram (for documentation/terminal)
plantuml -txt keycloak-token-validation-flow.puml

# Unicode text diagram
plantuml -utxt keycloak-architecture.puml
```

### Using Docker

```bash
# Generate PNG using Docker
docker run --rm -v $(pwd):/data plantuml/plantuml:latest *.puml

# Generate SVG using Docker
docker run --rm -v $(pwd):/data plantuml/plantuml:latest -tsvg *.puml
```

### Using Java Directly

```bash
# Download plantuml.jar
curl -L -o plantuml.jar https://github.com/plantuml/plantuml/releases/download/v1.2024.3/plantuml-1.2024.3.jar

# Generate diagrams
java -jar plantuml.jar *.puml
```

---

## Integration with IDEs

### VS Code

Install the **PlantUML** extension:
1. Search for "PlantUML" in Extensions
2. Install "PlantUML" by jebbs
3. Open any `.puml` file
4. Press `Alt+D` to preview

### IntelliJ IDEA / JetBrains IDEs

1. Install **PlantUML Integration** plugin
2. Right-click any `.puml` file
3. Select "Show PlantUML Diagram"

### Sublime Text

Install **PlantUML** package via Package Control.

### Online

Use [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/):
1. Copy `.puml` file content
2. Paste into online editor
3. Download generated image

---

## Output Formats

PlantUML supports multiple output formats:

| Format | Flag | Use Case |
|--------|------|----------|
| PNG | `-tpng` | Default, web embedding |
| SVG | `-tsvg` | Scalable, high quality |
| PDF | `-tpdf` | Documentation, printing |
| TXT | `-txt` | ASCII art, terminal display |
| UTXT | `-utxt` | Unicode ASCII art |
| EPS | `-teps` | Vector graphics |
| LaTeX | `-tlatex` | Academic papers |

---

## Customization

### Themes

PlantUML supports themes for consistent styling:

```plantuml
!theme plain       ' Default clean theme
!theme bluegray    ' Blue-gray theme
!theme cerulean    ' Cerulean blue theme
!theme superhero   ' Dark theme
```

Available in `.puml` files via `!theme` directive.

### Colors

Customize colors using skinparam:

```plantuml
skinparam backgroundColor #FFFFFF
skinparam componentBackgroundColor LightSkyBlue
skinparam componentBorderColor Black
```

### Fonts

```plantuml
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam titleFontSize 16
skinparam titleFontStyle bold
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Generate PlantUML Diagrams

on:
  push:
    paths:
      - 'documentation/diagrams/*.puml'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate PlantUML
        uses: grassedge/generate-plantuml-action@v1.5
        with:
          path: documentation/diagrams
          message: "Update generated diagrams"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI

```yaml
generate-diagrams:
  stage: build
  image: plantuml/plantuml:latest
  script:
    - plantuml -tpng -o ../images documentation/diagrams/*.puml
  artifacts:
    paths:
      - documentation/images/*.png
```

---

## Troubleshooting

### GraphViz Not Found

PlantUML requires GraphViz for some diagram types:

```bash
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows
choco install graphviz
```

### Java Not Found

PlantUML requires Java:

```bash
# Check Java version
java -version

# Install if missing (macOS)
brew install openjdk@17
```

### Memory Issues for Large Diagrams

Increase Java heap size:

```bash
java -Xmx1024m -jar plantuml.jar *.puml
```

---

## Best Practices

1. **Keep diagrams focused** - One concept per diagram
2. **Use meaningful names** - Clear file names and titles
3. **Add notes** - Explain complex interactions
4. **Version control** - Commit `.puml` sources, not generated images
5. **Generate on demand** - Use CI/CD to generate images automatically
6. **Document changes** - Update diagrams when architecture changes

---

## Related Documentation

- [Keycloak Auth Flow Diagrams](../keycloak-auth-flow-diagrams.md) - Text-based ASCII diagrams
- [PlantUML Language Reference](https://plantuml.com/guide) - Official syntax guide
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [Keycloak Documentation](https://www.keycloak.org/docs/latest/)

---

## Diagram Sources

All diagrams are generated from:
- **Source:** `keycloak-auth-flow-diagrams.md`
- **Generated:** April 7, 2026
- **Author:** System Documentation

---

**Version:** 1.0  
**Last Updated:** April 7, 2026

