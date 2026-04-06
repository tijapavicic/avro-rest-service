# Git Multirepo (Polyrepo) - Complete Guide

## Overview

**Multirepo** (also called **polyrepo**) is an architecture where each project, service, or component lives in its **own separate Git repository**.

---

## 🏗️ Core Concept

Instead of having one repository containing all your code (monorepo), you have:
- `service-a` → Repository #1
- `service-b` → Repository #2
- `shared-library` → Repository #3
- `frontend-app` → Repository #4

Each with its own:
- Git history
- CI/CD pipeline
- Version/release cycle
- Access controls
- Dependencies

---

## 📊 Multirepo vs Monorepo

| Aspect | **Multirepo (Polyrepo)** | **Monorepo** |
|--------|-------------------------|--------------|
| **Structure** | Multiple repositories | Single repository |
| **Ownership** | Team owns specific repos | Shared ownership |
| **CI/CD** | Per-repo pipelines | Unified pipeline |
| **Dependencies** | Published packages (npm, Maven) | Direct code references |
| **Versioning** | Independent versions | Unified versioning |
| **Cloning** | Clone only what you need | Clone everything |
| **Scale** | Scales well with teams | Can become unwieldy |
| **Refactoring** | Requires coordinated changes | Simple atomic changes |

---

## ✅ Advantages of Multirepo

### 1. Clear Boundaries
- Each service/component is isolated
- Enforces API contracts between services
- Strong separation of concerns

### 2. Independent Deployment
- Deploy `service-a` without touching `service-b`
- Separate release cycles
- Reduced blast radius for failures

### 3. Scalable Teams
- Teams own their repos
- Reduced merge conflicts
- Less coordination overhead
- Parallel development

### 4. Granular Access Control
- Different permissions per repo
- Secure sensitive services
- Compliance requirements easier to meet

### 5. Smaller Clones
- Developers only clone what they work on
- Faster git operations
- Less disk space required

### 6. Technology Freedom
- Different languages/frameworks per repo
- No build tool conflicts
- Each team can choose best tools

### 7. Focused CI/CD
- Faster builds (only changed repo)
- Targeted testing
- Independent pipeline optimization

---

## ❌ Disadvantages of Multirepo

### 1. Cross-Repo Changes are Hard
- Changing an API requires coordinated PRs across multiple repos
- No atomic commits across services
- Risk of breaking changes

### 2. Dependency Management Overhead
- Must publish/version shared libraries
- Transitive dependency hell
- Version conflicts between services

### 3. Code Duplication
- Common code must be extracted to libraries
- Risk of copy-paste between repos
- DRY principle harder to enforce

### 4. Tooling Complexity
- Need scripts to clone/update multiple repos
- CI/CD across repos is more complex
- Developer onboarding is harder

### 5. Discoverability
- Harder to find code across repos
- No unified search
- Documentation fragmentation

### 6. Version Compatibility
- Service A on lib@1.2.3, Service B on lib@2.0.0
- Testing compatibility matrix
- Integration testing complexity

### 7. Shared Changes are Expensive
- Update a common interface? Touch 10 repos
- Coordinated releases
- More PRs to review

---

## 🛠️ Tools for Managing Multirepos

### 1. Git Submodules

Native Git feature for embedding repositories within repositories.

```bash
# Add a submodule
git submodule add https://github.com/org/shared-lib

# Clone a repo with submodules
git clone --recursive https://github.com/org/main-repo

# Update submodules
git submodule update --init --recursive

# Update to latest
git submodule update --remote
```

**Pros:**
- Native Git feature
- No additional tools needed
- Locks to specific commits

**Cons:**
- Complex to use correctly
- Easy to mess up
- Detached HEAD issues
- Steep learning curve

---

### 2. Git Subtree

Merges external repositories as subdirectories.

```bash
# Add a subtree
git subtree add --prefix=lib https://github.com/org/shared-lib main

# Pull updates
git subtree pull --prefix=lib https://github.com/org/shared-lib main

# Push changes back
git subtree push --prefix=lib https://github.com/org/shared-lib main
```

**Pros:**
- Simpler than submodules
- No special clone commands
- Regular git commands work

**Cons:**
- History gets mixed
- Larger repo size
- Push/pull can be confusing

---

### 3. Meta (Facebook's Tool)

Orchestrates multiple repos as one.

```bash
# Install
npm install -g meta

# Create meta project
meta init

# Add repos
meta project add service-a git@github.com:org/service-a
meta project add service-b git@github.com:org/service-b

# Clone all
meta git clone

# Run commands across all repos
meta git status
meta git pull
meta exec "npm install"
```

**Website:** https://github.com/mateodelnorte/meta

---

### 4. Repo (Google's Tool - Android)

XML manifest-based multi-repo tool.

```xml
<!-- manifest.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<manifest>
  <remote name="origin" fetch="https://github.com/org"/>
  
  <project name="service-a" path="services/a" remote="origin"/>
  <project name="service-b" path="services/b" remote="origin"/>
  <project name="shared-lib" path="lib" remote="origin"/>
</manifest>
```

```bash
# Initialize
repo init -u https://github.com/org/manifests

# Sync all repos
repo sync

# Run command across all
repo forall -c 'git status'
```

**Website:** https://gerrit.googlesource.com/git-repo/

---

### 5. Custom Scripts

Simple bash/shell scripts for common operations.

```bash
#!/bin/bash
# clone-all.sh

REPOS=(
  "service-a"
  "service-b"
  "shared-lib"
  "frontend-app"
)

ORG="mycompany"

for repo in "${REPOS[@]}"; do
  echo "Cloning ${repo}..."
  git clone "git@github.com:${ORG}/${repo}.git"
done

echo "✅ All repos cloned!"
```

```bash
#!/bin/bash
# update-all.sh

for dir in */; do
  if [ -d "$dir/.git" ]; then
    echo "Updating $dir..."
    cd "$dir"
    git pull
    cd ..
  fi
done
```

```bash
#!/bin/bash
# status-all.sh

for dir in */; do
  if [ -d "$dir/.git" ]; then
    echo "=== $dir ==="
    cd "$dir"
    git status -s
    cd ..
  fi
done
```

---

### 6. Package Managers

Manage shared code as versioned dependencies.

#### Maven (Java)

```xml
<!-- shared-lib/pom.xml -->
<groupId>com.company</groupId>
<artifactId>shared-lib</artifactId>
<version>1.2.0</version>

<!-- Deploy -->
<distributionManagement>
  <repository>
    <id>nexus</id>
    <url>https://nexus.company.com/repository/maven-releases</url>
  </repository>
</distributionManagement>
```

```bash
# Publish
mvn clean deploy
```

```xml
<!-- service-a/pom.xml -->
<dependency>
  <groupId>com.company</groupId>
  <artifactId>shared-lib</artifactId>
  <version>1.2.0</version>
</dependency>
```

#### npm (JavaScript)

```json
// shared-lib/package.json
{
  "name": "@company/shared-lib",
  "version": "1.2.0"
}
```

```bash
# Publish
npm publish --access public
```

```json
// service-a/package.json
{
  "dependencies": {
    "@company/shared-lib": "^1.2.0"
  }
}
```

#### Go Modules

```bash
# Tag in shared-lib repo
git tag v1.2.0
git push origin v1.2.0
```

```go
// service-a/go.mod
module github.com/company/service-a

require (
    github.com/company/shared-lib v1.2.0
)
```

---

## 🎯 Best Practices

### 1. Clear Repository Naming Convention

Use consistent, descriptive names:

```
✅ Good:
org/backend-user-service
org/backend-payment-service
org/backend-notification-service
org/frontend-web-app
org/frontend-mobile-app
org/lib-shared-utils
org/lib-domain-models

❌ Bad:
org/project1
org/stuff
org/backend
org/utils
```

---

### 2. Shared Library Strategy

**Extract common code properly:**

```
✅ Create shared libraries for:
- Common utilities
- Shared domain models
- API clients
- Configuration utilities
- Security/auth helpers

❌ Don't extract too early:
- Wait until code is used in 3+ places
- Avoid premature abstraction
```

**Versioning:**
- Use Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`
- Breaking changes → MAJOR bump
- New features → MINOR bump
- Bug fixes → PATCH bump

**Publishing:**
```bash
# Maven
mvn versions:set -DnewVersion=1.2.0
mvn clean deploy

# npm
npm version 1.2.0
npm publish

# Go
git tag v1.2.0
git push origin v1.2.0
```

---

### 3. API Contracts

**Define clear contracts between services:**

**OpenAPI (REST):**
```yaml
# user-service/openapi.yaml
openapi: 3.0.0
info:
  title: User Service API
  version: 1.2.0
paths:
  /users/{id}:
    get:
      summary: Get user by ID
      responses:
        '200':
          description: Success
```

**gRPC (Protocol Buffers):**
```protobuf
// user-service.proto
syntax = "proto3";

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
}

message User {
  string id = 1;
  string name = 2;
}
```

**Contract Testing:**
- Use Pact or Spring Cloud Contract
- Consumer-driven contracts
- Automated contract verification

---

### 4. CI/CD Per Repo

Each repo should have its own pipeline:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build with Maven
        run: mvn -B clean verify
      
      - name: Run tests
        run: mvn test
      
      - name: Security scan
        run: mvn org.owasp:dependency-check-maven:check
      
      - name: Build Docker image
        run: docker build -t service-a:${{ github.sha }} .
      
      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: docker push service-a:${{ github.sha }}
```

---

### 5. Documentation Hub

Create a central place for documentation:

**Option A: Separate docs repo**
```
org/documentation/
  ├── architecture/
  │   ├── overview.md
  │   ├── services.md
  │   └── diagrams/
  ├── apis/
  │   ├── user-service.md
  │   └── payment-service.md
  └── runbooks/
      ├── deployment.md
      └── troubleshooting.md
```

**Option B: GitHub Wiki**
- Each repo has its own wiki
- Main repo wiki links to others

**Option C: Confluence/Notion**
- Centralized documentation platform
- Link to relevant repos

**Include:**
- Architecture diagrams
- Service catalog
- API documentation
- Deployment guides
- Troubleshooting runbooks
- Onboarding guides

---

### 6. Dependency Updates

Use automated tools to keep dependencies current:

**Dependabot (GitHub):**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

**Renovate:**
```json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "updateTypes": ["minor", "patch"],
      "automerge": true
    }
  ]
}
```

---

### 7. Mono-to-Multi Migration Strategy

If migrating from monorepo to multirepo:

**Phase 1: Identify Boundaries**
```
Current monorepo:
  /services
    /user-service
    /payment-service
  /libs
    /shared-utils

Future structure:
  org/user-service (repo 1)
  org/payment-service (repo 2)
  org/shared-utils (repo 3)
```

**Phase 2: Extract Shared Code First**
1. Create `shared-utils` repo
2. Publish as library (v1.0.0)
3. Update services to depend on library

**Phase 3: Split Services**
1. Create new repo for each service
2. Use `git filter-branch` to preserve history
3. Set up CI/CD
4. Update dependencies

**Phase 4: Deprecate Monorepo**
1. Archive old monorepo
2. Update documentation
3. Redirect teams to new repos

---

## 🏢 When to Use Multirepo

### ✅ Use Multirepo When:

1. **Microservices Architecture**
   - Each service is independently deployable
   - Services have different scaling needs
   - Clear service boundaries

2. **Large Organizations**
   - Multiple teams (10+ engineers)
   - Different teams own different services
   - Need for team autonomy

3. **Different Tech Stacks**
   - Service A: Java/Spring Boot
   - Service B: Node.js/Express
   - Service C: Python/Django

4. **Independent Deployment**
   - Services release on different schedules
   - Critical services need isolated pipelines
   - Canary/blue-green deployments per service

5. **Security/Compliance**
   - Different repos have different access levels
   - Sensitive services need restricted access
   - Audit trails per service

6. **Open Source Components**
   - Some repos are public, others private
   - Need separate contribution workflows

---

### ❌ Avoid Multirepo When:

1. **Small Team**
   - Less than 10 engineers
   - Everyone works on everything
   - Coordination overhead too high

2. **Frequent Cross-Cutting Changes**
   - Shared domain models change often
   - Tight coupling between services
   - Atomic changes needed across services

3. **Startup/MVP Phase**
   - Moving fast, architecture evolving
   - Monorepo provides faster iteration
   - Can split later when boundaries stabilize

4. **Shared Codebase Culture**
   - Team prefers unified history
   - Single source of truth
   - Comprehensive refactoring is common

5. **Tooling Immaturity**
   - Team lacks experience with multirepo
   - No CI/CD expertise
   - Limited DevOps resources

---

## 🔄 Example: Multirepo Workflow

### Scenario: Update Shared Library and Consume in Service

```bash
# ========================================
# Step 1: Clone repos you need
# ========================================
cd ~/projects
git clone git@github.com:company/user-service
git clone git@github.com:company/shared-lib

# ========================================
# Step 2: Make changes in shared-lib
# ========================================
cd shared-lib

# Create feature branch
git checkout -b feature/add-validation

# Make changes
cat >> src/main/java/com/company/ValidationUtils.java << 'EOF'
package com.company;

public class ValidationUtils {
    public static boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }
}
EOF

# Test changes
mvn clean test

# Commit and push
git add .
git commit -m "feat: add email validation utility"
git push origin feature/add-validation

# Create PR, get reviewed, merge to main

# ========================================
# Step 3: Release new version
# ========================================
git checkout main
git pull

# Update version
mvn versions:set -DnewVersion=1.2.0
git add pom.xml
git commit -m "chore: bump version to 1.2.0"

# Tag release
git tag v1.2.0
git push origin v1.2.0

# Publish to Maven Central / Nexus
mvn clean deploy

# ========================================
# Step 4: Update dependency in user-service
# ========================================
cd ../user-service

# Create dependency update branch
git checkout -b chore/upgrade-shared-lib

# Update pom.xml
cat > pom.xml << 'EOF'
<dependency>
  <groupId>com.company</groupId>
  <artifactId>shared-lib</artifactId>
  <version>1.2.0</version>
</dependency>
EOF

# Update code to use new utility
cat > src/main/java/com/company/UserService.java << 'EOF'
import com.company.ValidationUtils;

public class UserService {
    public void registerUser(String email) {
        if (!ValidationUtils.isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email");
        }
        // ... rest of logic
    }
}
EOF

# Test changes
mvn clean verify

# Commit and push
git add .
git commit -m "chore: upgrade shared-lib to 1.2.0 and use new validation"
git push origin chore/upgrade-shared-lib

# Create PR, get reviewed, merge to main

# ========================================
# Step 5: Deploy user-service
# ========================================
# Automatic via CI/CD after merge
```

---

## 📚 Real-World Examples

### Companies Using Multirepo

1. **Netflix**
   - Hundreds of repos for microservices
   - Each team owns their services
   - Heavy use of shared libraries

2. **Amazon**
   - Thousands of repos
   - "Two-pizza teams" own services
   - Service-oriented architecture

3. **Spotify**
   - Squad-based repos
   - Each squad has autonomy
   - Shared platform libraries

4. **Google** (partially)
   - Mix of monorepo (main codebase) and multirepo (projects)
   - Android uses Repo tool

5. **Microsoft**
   - GitHub: multirepo
   - Azure DevOps: multirepo
   - Windows: monorepo (historical)

---

## 🔍 Multirepo Decision Matrix

| Factor | Weight | Monorepo Score | Multirepo Score |
|--------|--------|----------------|-----------------|
| Team Size (1-10) | High | 9 | 3 |
| Team Size (10-50) | High | 6 | 7 |
| Team Size (50+) | High | 4 | 9 |
| Microservices | High | 5 | 9 |
| Monolith | High | 9 | 3 |
| Frequent Refactoring | Medium | 9 | 4 |
| Independent Deploys | High | 4 | 9 |
| Mixed Tech Stack | Medium | 6 | 9 |
| Shared Domain | High | 9 | 5 |
| Strong Boundaries | High | 5 | 9 |

**Score Interpretation:**
- 8-10: Excellent fit
- 6-7: Good fit
- 4-5: Moderate fit
- 1-3: Poor fit

---

## 🎓 Learning Path

1. **Beginner**: Start with monorepo
2. **Intermediate**: Extract shared libraries
3. **Advanced**: Split into multirepo when boundaries clear
4. **Expert**: Orchestrate complex multirepo systems

---

## 🤔 Your Current Setup Analysis

### Current Structure (Monorepo with Modules)

```
avro-rest-service/  (monorepo)
  ├── avro-model/           (module)
  ├── bulk-import-producer/ (module)
  ├── bulk-import-consumer/ (module)
  ├── calculation-engine/   (module)
  ├── simulation-engine/    (module)
  └── large-payload-webflux/ (module)
```

### Potential Multirepo Structure

```
org/avro-model                (shared library - repo 1)
org/bulk-import-producer      (service - repo 2)
org/bulk-import-consumer      (service - repo 3)
org/calculation-engine        (service - repo 4)
org/simulation-engine         (service - repo 5)
org/large-payload-webflux     (service - repo 6)
```

### Recommendation

**Stick with monorepo IF:**
- ✅ Small team (< 5 people)
- ✅ Everyone works on all modules
- ✅ Frequent changes across modules
- ✅ Modules are tightly coupled
- ✅ Single deployment unit

**Consider multirepo IF:**
- 📊 Growing to 10+ engineers
- 📊 Clear team ownership per module
- 📊 Modules deployed independently
- 📊 Different scaling requirements
- 📊 Need granular access control

**Hybrid Approach:**
1. Keep monorepo for now
2. Extract `avro-model` as first shared library
3. Publish to Maven Central/Nexus
4. Test multirepo workflow with low-risk component
5. Split other modules only if pain points emerge

---

## 🚀 Migration Checklist

If you decide to migrate to multirepo:

- [ ] Document current architecture
- [ ] Identify service boundaries
- [ ] List shared dependencies
- [ ] Create shared library repos first
- [ ] Set up artifact repository (Nexus/Artifactory)
- [ ] Publish shared libraries
- [ ] Create service repos
- [ ] Set up CI/CD per repo
- [ ] Migrate code with git history
- [ ] Update documentation
- [ ] Train team on new workflow
- [ ] Monitor and iterate

---

## 📖 Further Reading

- [Monorepo vs Multirepo](https://www.atlassian.com/git/tutorials/monorepos)
- [Google's Monorepo](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext)
- [Microservices and Git](https://martinfowler.com/articles/microservices.html)
- [Semantic Versioning](https://semver.org/)
- [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)

---

## 🎯 Key Takeaways

1. **Multirepo** = Multiple repositories, each self-contained
2. **Best for**: Large teams, microservices, independent deployments
3. **Challenges**: Cross-repo changes, dependency management
4. **Tools**: Git submodules, Meta, Repo, package managers
5. **Start simple**: Monorepo → Extract libraries → Split services
6. **No silver bullet**: Choose based on team size, architecture, and needs

---

**Document Version:** 1.0.0  
**Last Updated:** March 31, 2026  
**Author:** GitHub Copilot  
**Repository:** avro-rest-service

