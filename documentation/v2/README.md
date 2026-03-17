# Documentation v2 - PlantUML Architecture Diagrams

## Overview

This directory contains comprehensive PlantUML diagrams and documentation for the Avro REST Service simulation engine architectures. All diagrams are available in both sequence and component/flowchart formats for different perspectives.

**Version:** 2.0  
**Created:** March 17, 2026  
**Format:** PlantUML (`.puml`)

## Directory Structure

```
v2/
├── README.md (this file)
│
├── Appendix A: Event-Driven Architecture (Chunked Processing)
│   ├── appendix-a-sequence-diagram.puml
│   ├── appendix-a-flowchart-diagram.puml
│   └── appendix-a-README.md
│
├── Appendix C: Direct Streaming Alternative
│   ├── appendix-c-sequence-diagram.puml
│   ├── appendix-c-flowchart-diagram.puml
│   └── appendix-c-README.md
│
└── Data Flow: Large Payload Processing (Dual Pipeline)
    ├── data-flow-sequence-diagram.puml
    ├── data-flow-component-diagram.puml
    └── data-flow-README.md
```

## Quick Start

### Install PlantUML

```bash
# macOS
brew install plantuml

# Linux (Ubuntu/Debian)
apt-get install plantuml

# Linux (RHEL/CentOS)
yum install plantuml

# Or download from https://plantuml.com/download
```

### Generate All Diagrams

```bash
cd documentation/v2

# Generate PNG images
plantuml *.puml

# Generate SVG (scalable)
plantuml -tsvg *.puml

# Generate ASCII art (terminal-friendly)
plantuml -ttxt *.puml

# Generate PDF (requires -Djava.awt.headless=false)
plantuml -tpdf *.puml
```

### IDE Integration

**IntelliJ IDEA:**
1. Install "PlantUML Integration" plugin
2. Right-click `.puml` file → "Open in PlantUML Preview"
3. Auto-refresh on save

**VS Code:**
1. Install "PlantUML" extension by jebbs
2. Open `.puml` file → Press `Alt+D` for preview
3. Export: Right-click → "Export Diagram"

**Eclipse:**
1. Install PlantUML plugin from marketplace
2. Open `.puml` file → Preview appears automatically

## Architecture Diagrams

### 1. Appendix A: Event-Driven Architecture (Recommended)

**Architecture:** Chunked processing with object storage

**Files:**
- `appendix-a-sequence-diagram.puml` - Temporal event flow
- `appendix-a-flowchart-diagram.puml` - Component structure
- `appendix-a-README.md` - Comprehensive documentation

**Key Features:**
- ✅ Async event-driven coordination
- ✅ Chunked data processing (Parquet files)
- ✅ Object storage intermediate layer
- ✅ High fault tolerance
- ✅ Independent scaling
- ✅ Best for large batch jobs

**Components:**
```
sim-engine-frontend → sim-engine-backend → Message Broker
                                              ↓
calculation-engine → Source DB → Object Storage (Parquet)
                                              ↓
simulation-engine → Simulation DB
```

**Use Cases:**
- Large-scale batch simulations (TB-scale)
- Fault-tolerant processing requirements
- Independent scaling of calculation and persistence
- Reprocessing failed operations

**Read more:** [appendix-a-README.md](appendix-a-README.md)

---

### 2. Appendix C: Direct Streaming Alternative

**Architecture:** Direct streaming without intermediate storage

**Files:**
- `appendix-c-sequence-diagram.puml` - Streaming flow
- `appendix-c-flowchart-diagram.puml` - Simplified structure
- `appendix-c-README.md` - Comprehensive documentation

**Key Features:**
- ✅ Lower latency (single transfer stage)
- ✅ No intermediate storage costs
- ✅ Direct gRPC or Arrow Flight streaming
- ✅ Simpler architecture
- ✅ Best for real-time processing

**Components:**
```
sim-engine-frontend → sim-engine-backend → Message Broker
                                              ↓
calculation-engine → Source DB
         ↓ (gRPC/Arrow Flight streaming)
simulation-engine → Simulation DB
```

**Use Cases:**
- Real-time data processing
- Low-latency requirements
- Cost optimization (no object storage)
- Streaming analytics
- Small to medium datasets

**Read more:** [appendix-c-README.md](appendix-c-README.md)

---

### 3. Data Flow: Large Payload Processing (Dual Pipeline)

**Architecture:** Parallel legacy and next-generation pipelines

**Files:**
- `data-flow-sequence-diagram.puml` - Temporal flow with dual pipelines
- `data-flow-component-diagram.puml` - Layered architecture
- `data-flow-README.md` - Comprehensive documentation

**Key Features:**
- ✅ Dual pipeline (Legacy + Next-Gen)
- ✅ Queue partitioning (3 per pipeline)
- ✅ Shared external-engine persistence
- ✅ Database separation
- ✅ 1GB+ payload support
- ✅ Zero-downtime migration

**Components:**
```
simul-frontend → simul-orchestrator
                      ↓
       ┌──────────────┴──────────────┐
       ↓                              ↓
processingNG Topic              processing Topic
  ├── rr1-ng-queue                ├── rr1-queue
  ├── rr2-ng-queue                ├── rr2-queue
  └── rr3-ng-queue                └── rr3-queue
       ↓                              ↓
processingNG-consumer         processing-consumer
       └──────────┬───────────────────┘
                  ↓
           external-engine
          ┌───────┴────────┐
          ↓                ↓
    postgreNgDB        postgreDB
```

**Use Cases:**
- Large payload streaming (1GB+)
- Legacy system migration
- A/B testing new architectures
- Gradual rollout strategies
- Parallel processing pipelines

**Read more:** [data-flow-README.md](data-flow-README.md)

---

## Diagram Comparison Matrix

| Feature | Appendix A (Chunked) | Appendix C (Streaming) | Data Flow (Dual) |
|---------|---------------------|------------------------|------------------|
| **Latency** | Medium (2 stages) | Low (1 stage) | Medium (queue-based) |
| **Throughput** | Very High | High | Very High |
| **Fault Tolerance** | Excellent | Good | Excellent |
| **Complexity** | High | Medium | Very High |
| **Storage Cost** | High (object storage) | Low | Medium |
| **Scalability** | Excellent | Good | Excellent |
| **Real-time** | No | Yes | No |
| **Batch Processing** | Excellent | Poor | Excellent |
| **Migration Support** | N/A | N/A | Excellent |
| **Best For** | Large batch jobs | Real-time streams | Legacy migration |

## Choosing the Right Architecture

### Decision Tree

```
Start Here
    ↓
Need real-time processing?
    ├── Yes → Appendix C (Direct Streaming)
    └── No → Continue
         ↓
    Need to support legacy system?
        ├── Yes → Data Flow (Dual Pipeline)
        └── No → Continue
             ↓
        Large datasets (TB-scale)?
            ├── Yes → Appendix A (Chunked)
            └── No → Appendix C (Direct Streaming)
```

### Detailed Selection Criteria

#### Choose Appendix A (Chunked) If:
- ✅ Large batch simulations (TB-scale)
- ✅ Need fault tolerance and reprocessing
- ✅ Unreliable network between services
- ✅ Independent scaling requirements
- ✅ Complex data transformations needed

#### Choose Appendix C (Streaming) If:
- ✅ Real-time or near-real-time requirements
- ✅ Low latency critical
- ✅ Cost optimization priority
- ✅ Stable network infrastructure
- ✅ Smaller datasets (GB-scale)

#### Choose Data Flow (Dual Pipeline) If:
- ✅ Migrating from legacy to new system
- ✅ Need A/B testing capabilities
- ✅ Large payload streaming (1GB+)
- ✅ Parallel processing requirements
- ✅ Zero-downtime migration needed

## Common Tasks

### Generate Specific Format

```bash
# PNG (default)
plantuml appendix-a-sequence-diagram.puml

# SVG (best for web/docs)
plantuml -tsvg appendix-a-sequence-diagram.puml

# PDF (presentation-ready)
plantuml -tpdf appendix-a-sequence-diagram.puml

# ASCII (terminal/text docs)
plantuml -ttxt appendix-a-sequence-diagram.puml

# EPS (LaTeX/academic papers)
plantuml -teps appendix-a-sequence-diagram.puml
```

### Validate Syntax

```bash
# Check syntax without generating
plantuml -syntax appendix-a-sequence-diagram.puml

# Check all diagrams
plantuml -syntax *.puml

# Check only (no generation)
plantuml -checkonly *.puml
```

### Batch Processing

```bash
# Generate all in directory
plantuml documentation/v2

# Generate with specific output directory
plantuml -o /output/path documentation/v2/*.puml

# Generate multiple formats
for ext in png svg txt; do
  plantuml -t$ext *.puml
done
```

### Customize Output

```bash
# High DPI for presentations
plantuml -DPLANTUML_LIMIT_SIZE=16384 appendix-a-sequence-diagram.puml

# Custom theme
echo "!theme cerulean" | cat - appendix-a-sequence-diagram.puml | plantuml -pipe > output.png

# Transparent background
plantuml -tpng -transparent appendix-a-sequence-diagram.puml
```

## Diagram Standards

### Naming Conventions

```
<appendix>-<type>-diagram.puml

Examples:
  appendix-a-sequence-diagram.puml
  appendix-c-flowchart-diagram.puml
  data-flow-component-diagram.puml
```

### Color Coding

```plantuml
!define ASYNC_COLOR #LightBlue    ' Async components
!define SYNC_COLOR #LightCoral     ' Sync components  
!define DATA_COLOR #LightGreen     ' Data processing
!define EVENT_COLOR #Orange        ' Event publishers
!define QUEUE_COLOR #LightBlue     ' Message queues
!define DB_COLOR #LightGray        ' Databases
```

### Documentation Requirements

Each diagram set must include:
- ✅ Sequence diagram (temporal flow)
- ✅ Component/flowchart diagram (structure)
- ✅ README with comprehensive documentation
- ✅ Component descriptions
- ✅ Data flow explanations
- ✅ Use cases and selection criteria
- ✅ Performance characteristics
- ✅ Troubleshooting guide

## Best Practices

### Diagram Design

1. **Keep it focused**: One concept per diagram
2. **Use colors consistently**: Follow color coding standards
3. **Add legends**: Explain non-obvious elements
4. **Include notes**: Clarify complex flows
5. **Layer complexity**: Start simple, add details
6. **Label connections**: Show protocols/data types
7. **Show error paths**: Include failure scenarios

### Documentation

1. **Sync diagrams and docs**: Update together
2. **Version control**: Track changes with git
3. **Export regularly**: Generate PNG/SVG for wikis
4. **Cross-reference**: Link related diagrams
5. **Include examples**: Code snippets where helpful
6. **Document decisions**: Explain architectural choices

### Maintenance

1. **Review quarterly**: Ensure accuracy
2. **Update on changes**: Keep in sync with code
3. **Validate syntax**: Use `plantuml -syntax`
4. **Test rendering**: Verify all output formats
5. **Archive old versions**: Maintain history

## Troubleshooting

### Common Issues

**Issue: "Cannot find java" error**
```bash
# Install Java (required for PlantUML)
brew install openjdk@11  # macOS
apt-get install openjdk-11-jdk  # Linux

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 11)  # macOS
```

**Issue: "Out of memory" error**
```bash
# Increase Java heap size
export _JAVA_OPTIONS="-Xmx2048m"
plantuml *.puml
```

**Issue: Diagram doesn't render**
```bash
# Check syntax
plantuml -syntax appendix-a-sequence-diagram.puml

# Try simple test
echo "@startuml\nAlice -> Bob: Hello\n@enduml" | plantuml -pipe > test.png
open test.png  # macOS
xdg-open test.png  # Linux
```

**Issue: Fonts look wrong**
```bash
# Install graphviz for better fonts
brew install graphviz  # macOS
apt-get install graphviz  # Linux

# List available fonts
plantuml -listfonts
```

**Issue: IDE plugin not working**
```bash
# IntelliJ: Invalidate Caches
File → Invalidate Caches / Restart

# VS Code: Reload Window
Cmd+Shift+P → "Developer: Reload Window"
```

## Integration

### CI/CD Pipeline

```yaml
# GitHub Actions example
name: Generate Diagrams
on: [push]
jobs:
  diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install PlantUML
        run: sudo apt-get install -y plantuml
      - name: Generate diagrams
        run: |
          cd documentation/v2
          plantuml -tsvg *.puml
          plantuml -tpng *.puml
      - name: Commit diagrams
        run: |
          git config user.name "GitHub Actions"
          git add documentation/v2/*.svg documentation/v2/*.png
          git commit -m "docs: regenerate diagrams" || echo "No changes"
          git push
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
cd documentation/v2
plantuml -checkonly *.puml
if [ $? -ne 0 ]; then
  echo "PlantUML syntax errors found. Fix before committing."
  exit 1
fi
```

### Documentation Generation

```bash
# Generate all formats for documentation site
./scripts/generate-docs.sh

# Contents:
#!/bin/bash
cd documentation/v2
for file in *.puml; do
  base=$(basename "$file" .puml)
  plantuml -tsvg "$file"
  plantuml -tpng "$file"
  plantuml -ttxt "$file"
  echo "Generated: $base.{svg,png,txt}"
done
```

## Resources

### Official Documentation
- **PlantUML Website**: https://plantuml.com/
- **Sequence Diagrams**: https://plantuml.com/sequence-diagram
- **Component Diagrams**: https://plantuml.com/component-diagram
- **Themes**: https://plantuml.com/theme

### Tools & Extensions
- **PlantUML Server**: https://www.plantuml.com/plantuml/
- **IntelliJ Plugin**: https://plugins.jetbrains.com/plugin/7017-plantuml-integration
- **VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml
- **Chrome Extension**: PlantUML Viewer

### Learning Resources
- **Real World PlantUML**: https://real-world-plantuml.com/
- **PlantUML Guide**: https://crashedmind.github.io/PlantUMLHitchhikersGuide/
- **Examples Gallery**: https://plantuml.com/examples

## Related Documentation

### Parent Directory
- [Main Documentation README](../readme.md) - Documentation index
- [Simulation Architecture](../sim-architecture.md) - Architecture overview
- [Event Schemas](../calculation-completed-event.json) - Event formats

### Project Root
- [Main README](../../README.md) - Project overview
- [How to Run](../../how-to-run-me.md) - Setup guide
- [Changelog](../../CHANGELOG.md) - Version history

## Contributing

### Proposing New Diagrams

1. **Discuss**: Open issue describing the diagram purpose
2. **Create**: Follow naming conventions and standards
3. **Document**: Include comprehensive README
4. **Test**: Validate syntax and rendering
5. **Review**: Submit PR with generated exports

### Review Checklist

- [ ] Diagram renders correctly in all formats (PNG, SVG, ASCII)
- [ ] Follows naming conventions
- [ ] Uses standard color coding
- [ ] Includes legend/notes
- [ ] README documentation complete
- [ ] Cross-references updated
- [ ] Exports committed (SVG, PNG)
- [ ] Syntax validated (`plantuml -syntax`)

---

**Maintainer:** Architecture Team  
**Contact:** architecture@example.com  
**Last Updated:** March 17, 2026

