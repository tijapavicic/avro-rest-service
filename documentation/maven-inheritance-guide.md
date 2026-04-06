# Maven Inheritance Guide for Junior Developers

**Last Updated:** November 15, 2016  
**Audience:** Engineers of Maven and multi-module projects
**Reading Time:** 15 minutes

---

## Table of Contents

1. [What is Maven Inheritance?](#what-is-maven-inheritance)
2. [Types of Maven Inheritance](#types-of-maven-inheritance)
3. [Parent POM Inheritance](#parent-pom-inheritance)
4. [Multi-Module Project Structure](#multi-module-project-structure)
5. [What Gets Inherited?](#what-gets-inherited)
6. [Dependency Management vs Dependencies](#dependency-management-vs-dependencies)
7. [Plugin Management vs Plugins](#plugin-management-vs-plugins)
8. [Properties Inheritance](#properties-inheritance)
9. [Real-World Example from This Project](#real-world-example-from-this-project)
10. [Best Practices](#best-practices)
11. [Common Pitfalls](#common-pitfalls)

---

## What is Maven Inheritance?

Maven inheritance allows child POMs to inherit configuration from a parent POM, similar to how classes inherit from parent classes in object-oriented programming.

**Why do we use it?**
- **DRY Principle**: Define common configuration once, use everywhere
- **Consistency**: All modules use the same Java version, dependency versions, plugin configurations
- **Maintainability**: Update one place instead of 10+ module POMs
- **Version Control**: Centralized dependency version management

---

## Types of Maven Inheritance

Maven provides two main inheritance mechanisms:

### 1. **Parent POM Inheritance** (Vertical Inheritance)
A child POM explicitly declares a parent POM using the `<parent>` element.

```xml
<parent>
    <groupId>com.example</groupId>
    <artifactId>parent-project</artifactId>
    <version>1.0.0</version>
    <relativePath>../pom.xml</relativePath>
</parent>
```

### 2. **Multi-Module Aggregation** (Horizontal Organization)
A parent POM lists child modules using the `<modules>` element. This is for build orchestration, not inheritance.

```xml
<modules>
    <module>child-module-1</module>
    <module>child-module-2</module>
</modules>
```

**Important:** These two concepts often work together but serve different purposes:
- **Parent inheritance** = configuration sharing (vertical)
- **Module aggregation** = build orchestration (horizontal)

---

## Parent POM Inheritance

### How to Declare a Parent

In a child module's `pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- Parent reference -->
    <parent>
        <groupId>com.example.avro</groupId>
        <artifactId>avro-rest-service</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <!-- Child coordinates -->
    <artifactId>sim-engine-backend</artifactId>
    <name>Simulation Engine Backend</name>
    <description>REST API for simulation management</description>

    <!-- Child-specific dependencies -->
    <dependencies>
        <!-- Inherits version from parent -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>
```

**Key Points:**
- Child inherits `groupId` and `version` from parent (if not specified)
- Child must specify its own `artifactId`
- `<relativePath>` helps Maven find the parent POM during build

---

## Multi-Module Project Structure

A typical multi-module project looks like this:

```
avro-rest-service/                    (root/parent)
├── pom.xml                           (parent POM)
├── avro-model/                       (child module)
│   └── pom.xml
├── sim-engine-backend/               (child module)
│   └── pom.xml
├── calculation-engine/               (child module)
│   └── pom.xml
└── simulation-engine/                (child module)
    └── pom.xml
```

### Parent POM (Root)

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example.avro</groupId>
    <artifactId>avro-rest-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>  <!-- Important! -->

    <!-- Build orchestration -->
    <modules>
        <module>avro-model</module>
        <module>sim-engine-backend</module>
        <module>calculation-engine</module>
        <module>simulation-engine</module>
    </modules>

    <!-- Shared configuration for all children -->
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>

    <!-- Dependency versions (not actual dependencies) -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>3.2.0</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

**Note:** `<packaging>pom</packaging>` means this project doesn't produce a JAR/WAR, only manages modules.

---

## What Gets Inherited?

When a child declares a parent, it inherits:

| Element | Inherited? | Override? | Notes |
|---------|-----------|-----------|-------|
| `<groupId>` | ✅ Yes | ✅ Yes | Usually inherited, rarely overridden |
| `<version>` | ✅ Yes | ✅ Yes | Usually inherited for consistency |
| `<properties>` | ✅ Yes | ✅ Yes | Merged; child properties win |
| `<dependencyManagement>` | ✅ Yes | ✅ Yes | Merged; child adds/overrides |
| `<dependencies>` | ✅ Yes | ✅ Yes | Merged; child adds more |
| `<pluginManagement>` | ✅ Yes | ✅ Yes | Merged; child adds/overrides |
| `<plugins>` | ✅ Yes | ✅ Yes | Merged; child adds more |
| `<repositories>` | ✅ Yes | ✅ Yes | Merged |
| `<modules>` | ❌ No | N/A | Module lists are not inherited |
| `<artifactId>` | ❌ No | N/A | Each module must have unique ID |
| `<name>` | ❌ No | ✅ Override | Should be set per module |
| `<description>` | ❌ No | ✅ Override | Should be set per module |

---

## Dependency Management vs Dependencies

This is one of the most confusing parts for beginners!

### `<dependencyManagement>` (Parent POM)

**Purpose:** Declare dependency versions centrally without adding them to classpath.

```xml
<!-- In parent pom.xml -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.15.2</version>
        </dependency>
        <dependency>
            <groupId>org.apache.avro</groupId>
            <artifactId>avro</artifactId>
            <version>1.11.3</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**Effect:** 
- ❌ Does NOT add these dependencies to any module
- ✅ Defines the version to use IF a child includes the dependency

### `<dependencies>` (Child POM)

**Purpose:** Actually add dependencies to the module's classpath.

```xml
<!-- In child module pom.xml -->
<dependencies>
    <!-- Version inherited from parent <dependencyManagement> -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <!-- No version needed! -->
    </dependency>
    
    <!-- Version NOT managed by parent, must specify -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.30</version>
    </dependency>
</dependencies>
```

**Effect:**
- ✅ Adds `jackson-databind` version `2.15.2` to classpath (version from parent)
- ✅ Adds `lombok` version `1.18.30` to classpath

### Why This Pattern?

**Benefits:**
1. **Consistent versions** across all modules
2. **Single source of truth** for version updates
3. **Child modules can opt-in** to dependencies they need
4. **Prevents version conflicts** between modules

**Example Scenario:**

```
Parent declares: jackson-databind = 2.15.2
  ├── Module A uses jackson-databind (gets 2.15.2)
  ├── Module B uses jackson-databind (gets 2.15.2)
  └── Module C doesn't need it (doesn't get it)

All modules using jackson use the SAME version!
```

---

## Plugin Management vs Plugins

Same concept as dependencies, but for Maven plugins.

### `<pluginManagement>` (Parent POM)

```xml
<!-- In parent pom.xml -->
<build>
    <pluginManagement>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.avro</groupId>
                <artifactId>avro-maven-plugin</artifactId>
                <version>1.11.3</version>
                <configuration>
                    <sourceDirectory>${project.basedir}/src/main/avro</sourceDirectory>
                    <outputDirectory>${project.build.directory}/generated-sources/avro</outputDirectory>
                </configuration>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```

**Effect:**
- ❌ Does NOT execute these plugins in any module
- ✅ Defines version and configuration IF a child uses the plugin

### `<plugins>` (Child POM)

```xml
<!-- In avro-model/pom.xml -->
<build>
    <plugins>
        <!-- Inherits version and config from parent -->
        <plugin>
            <groupId>org.apache.avro</groupId>
            <artifactId>avro-maven-plugin</artifactId>
            <executions>
                <execution>
                    <phase>generate-sources</phase>
                    <goals>
                        <goal>schema</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

**Effect:**
- ✅ Executes `avro-maven-plugin` with parent's configuration
- ✅ Child only needs to declare executions/goals

---

## Properties Inheritance

Properties are inherited and can be overridden.

### Parent Properties

```xml
<!-- In parent pom.xml -->
<properties>
    <java.version>17</java.version>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <spring-boot.version>3.2.0</spring-boot.version>
    <avro.version>1.11.3</avro.version>
</properties>
```

### Using Properties in Child

```xml
<!-- In child pom.xml -->
<dependencies>
    <dependency>
        <groupId>org.apache.avro</groupId>
        <artifactId>avro</artifactId>
        <version>${avro.version}</version>  <!-- Uses parent property -->
    </dependency>
</dependencies>
```

### Overriding Properties in Child

```xml
<!-- In child pom.xml -->
<properties>
    <!-- Override parent's value for this module only -->
    <maven.compiler.target>21</maven.compiler.target>
</properties>
```

---

## Real-World Example from This Project

Let's see how this project uses Maven inheritance:

### Project Structure

```
avro-rest-service/
├── pom.xml                      (parent)
├── avro-model/pom.xml          (child - generates Avro classes)
├── sim-engine-backend/pom.xml  (child - REST API)
├── calculation-engine/pom.xml  (child - worker)
├── simulation-engine/pom.xml   (child - worker)
├── bulk-import-producer/pom.xml (child - CSV processor)
└── bulk-import-consumer/pom.xml (child - Kafka consumer)
```

### Parent POM Pattern

```xml
<!-- Root pom.xml -->
<project>
    <groupId>com.example.avro</groupId>
    <artifactId>avro-rest-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <modules>
        <module>avro-model</module>
        <module>sim-engine-backend</module>
        <module>calculation-engine</module>
        <!-- ... -->
    </modules>

    <properties>
        <java.version>17</java.version>
        <spring-boot.version>3.2.0</spring-boot.version>
        <avro.version>1.11.3</avro.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

### Child Module Pattern (sim-engine-backend)

```xml
<!-- sim-engine-backend/pom.xml -->
<project>
    <parent>
        <groupId>com.example.avro</groupId>
        <artifactId>avro-rest-service</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <artifactId>sim-engine-backend</artifactId>
    <name>Simulation Engine Backend</name>

    <dependencies>
        <!-- Spring Boot Web - version from parent BOM -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Avro model - sibling module -->
        <dependency>
            <groupId>com.example.avro</groupId>
            <artifactId>avro-model</artifactId>
            <version>${project.version}</version>
        </dependency>
    </dependencies>
</project>
```

### Why This Works

1. **Shared Java version**: All modules compile with Java 17
2. **Consistent Spring Boot version**: All Spring modules use 3.2.0
3. **Shared Avro model**: All modules can depend on `avro-model` with `${project.version}`
4. **Single version bump**: Change version once in root POM or `VERSION` file
5. **Build order**: Maven builds `avro-model` first, then dependent modules

---

## Best Practices

### 1. **Use Spring Boot Parent or BOM**

Most Spring Boot projects use one of these patterns:

**Option A: Inherit from Spring Boot Parent**
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>
```

**Option B: Use Spring Boot BOM (Bill of Materials)**
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**This project uses Option B** because we have our own parent POM.

### 2. **Keep Parent POM Minimal**

Only put truly shared configuration in the parent:
- ✅ Java version
- ✅ Common dependency versions
- ✅ Plugin versions
- ❌ Module-specific dependencies
- ❌ Module-specific plugins

### 3. **Use `${project.version}` for Inter-Module Dependencies**

```xml
<dependency>
    <groupId>com.example.avro</groupId>
    <artifactId>avro-model</artifactId>
    <version>${project.version}</version>  <!-- Automatic version sync -->
</dependency>
```

### 4. **Set `<relativePath>` Explicitly**

```xml
<parent>
    <groupId>com.example.avro</groupId>
    <artifactId>avro-rest-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <relativePath>../pom.xml</relativePath>  <!-- Explicit path -->
</parent>
```

### 5. **Use Properties for Version Management**

```xml
<properties>
    <avro.version>1.11.3</avro.version>
    <kafka.version>3.6.0</kafka.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.apache.avro</groupId>
            <artifactId>avro</artifactId>
            <version>${avro.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 6. **One Version to Rule Them All**

Keep version in sync:
- `VERSION` file (for scripts)
- Root `pom.xml` `<version>`
- All module `<parent><version>`

Use `mvn versions:set -DnewVersion=X.Y.Z` or our script:
```bash
./scripts/bump-version.sh --allow-dirty 1.1.0
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting `<dependencyManagement>`

**Wrong:**
```xml
<!-- Parent POM -->
<dependencies>
    <dependency>
        <groupId>org.apache.avro</groupId>
        <artifactId>avro</artifactId>
        <version>1.11.3</version>
    </dependency>
</dependencies>
```

**Problem:** Every child module gets Avro, even if it doesn't need it!

**Correct:**
```xml
<!-- Parent POM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.apache.avro</groupId>
            <artifactId>avro</artifactId>
            <version>1.11.3</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### ❌ Pitfall 2: Version Mismatch Between Parent and Child

**Wrong:**
```xml
<!-- Root pom.xml -->
<version>1.0.0-SNAPSHOT</version>

<!-- Child pom.xml -->
<parent>
    <version>1.1.0-SNAPSHOT</version>  <!-- Mismatch! -->
</parent>
```

**Problem:** Build fails with "Non-resolvable parent POM"

**Correct:** Keep versions in sync or use `${revision}` property pattern.

### ❌ Pitfall 3: Circular Dependencies Between Modules

**Wrong:**
```
avro-model depends on sim-engine-backend
sim-engine-backend depends on avro-model
```

**Problem:** Maven can't determine build order, build fails.

**Correct:** Create a clear dependency hierarchy:
```
avro-model (base, no dependencies)
  ↓
sim-engine-backend (depends on avro-model)
```

### ❌ Pitfall 4: Not Running from Root for Multi-Module Builds

**Wrong:**
```bash
cd sim-engine-backend
mvn clean install  # May fail if avro-model not built
```

**Problem:** Module can't find dependencies from sibling modules.

**Correct:**
```bash
cd /Users/copor/CodexProjects/avro-rest-service
mvn -B clean verify  # Builds all modules in correct order
```

### ❌ Pitfall 5: Overriding Managed Versions Without Good Reason

**Wrong:**
```xml
<!-- Parent manages Jackson 2.15.2 -->
<!-- Child overrides -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.14.0</version>  <!-- Different version! -->
</dependency>
```

**Problem:** Version conflicts, classpath issues, runtime errors.

**Correct:** Use parent's managed version unless you have a very good reason.

---

## Quick Reference Cheat Sheet

| I want to... | Use... | Where? |
|--------------|--------|--------|
| Share Java version across modules | `<properties>` | Parent POM |
| Declare dependency versions centrally | `<dependencyManagement>` | Parent POM |
| Actually add a dependency to my module | `<dependencies>` | Child POM |
| Share plugin versions/config | `<pluginManagement>` | Parent POM |
| Actually run a plugin in my module | `<plugins>` | Child POM |
| Build all modules together | `<modules>` | Parent POM |
| Reference my parent POM | `<parent>` | Child POM |
| Reference a sibling module | `<dependency>` with `${project.version}` | Child POM |

---

## Learn More

- [Maven POM Reference](https://maven.apache.org/pom.html)
- [Maven Dependency Mechanism](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html)
- [Spring Boot Maven Plugin](https://docs.spring.io/spring-boot/docs/current/maven-plugin/reference/htmlsingle/)
- This project's root `pom.xml` and module POMs

---

## Questions for Self-Check

After reading this guide, you should be able to answer:

1. What's the difference between `<dependencyManagement>` and `<dependencies>`?
2. Why do we use a parent POM in multi-module projects?
3. What does `<packaging>pom</packaging>` mean?
4. How do child modules reference sibling modules?
5. What happens if you don't specify a version in a child's `<dependency>` block?
6. When should you override a parent's property in a child module?
7. What is the Maven Super POM and why does it matter?
8. What does `<scope>import</scope>` do when importing a BOM?
9. How does the Maven Reactor determine build order?
10. What's the difference between parent inheritance and BOM imports?

### Answers

<details>
<summary>Click to reveal answers</summary>

1. **`<dependencyManagement>`** declares versions centrally without adding to classpath; **`<dependencies>`** actually adds dependencies to the module
2. To share configuration (versions, plugins, properties) across modules and maintain consistency
3. The project doesn't produce a JAR/WAR artifact, it's only for organizing/managing other modules
4. Using `<dependency>` with `<version>${project.version}</version>`
5. Maven looks for the version in parent's `<dependencyManagement>`; if not found, build fails
6. When a specific module needs different configuration (e.g., different Java version, environment-specific values)
7. The Super POM is Maven's built-in parent that ALL POMs inherit from, providing defaults like Maven Central repository, directory structure, and default plugins
8. It imports all `<dependencyManagement>` entries from the BOM POM into your project's dependency management
9. By building a dependency graph of inter-module dependencies and using topological sort to determine build order
10. Parent inheritance is single-inheritance of full POM configuration; BOM imports are multi-import of only dependencyManagement sections

</details>

---

**Created:** April 6, 2026  
**Project:** avro-rest-service  
**For questions, see:** `/how-to-run-me.md` or repository maintainers

