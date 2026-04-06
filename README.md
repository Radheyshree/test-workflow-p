# Codebase Summary

A CLI tool that analyzes a code repository and generates a comprehensive summary including directory structure, file type distribution, technology stack detection, code statistics, and dependency analysis.

## Features

- **Directory Structure Overview** - Visual representation of project structure
- **File Type Distribution** - Statistics by extension and category
- **Technology Stack Detection** - Automatic detection of languages and frameworks
- **Code Statistics** - Lines of code, file counts, and sizes
- **Dependency Analysis** - Parse package.json, requirements.txt, go.mod, Cargo.toml, and more
- **Architecture Pattern Detection** - Identify MVC, microservices, monorepo patterns
- **Multiple Output Formats** - JSON, text, and markdown reports

## Installation

```bash
npm install -g codebase-summary
```

Or use directly with npx:

```bash
npx codebase-summary /path/to/project
```

## Usage

### Basic Usage

```bash
codebase-summary /path/to/project
```

### With Options

```bash
# Output as JSON
codebase-summary /path/to/project --format json

# Save to file
codebase-summary /path/to/project --format markdown --output SUMMARY.md

# Exclude specific patterns
codebase-summary /path/to/project --exclude "dist/**,coverage/**"

# Limit recursion depth
codebase-summary /path/to/project --max-depth 10
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format <format>` | Output format (json, text, markdown) | text |
| `-o, --output <file>` | Output file path | stdout |
| `-e, --exclude <patterns>` | Additional exclude patterns (comma-separated) | - |
| `-d, --max-depth <depth>` | Maximum directory depth | 20 |
| `-h, --help` | Show help | - |
| `-V, --version` | Show version | - |

## Output Example

### Text Format

```
============================================================
Codebase Summary: my-project
============================================================

OVERVIEW
----------------------------------------
Path: /path/to/my-project
Generated: 2026-04-06T12:00:00Z

STATISTICS
----------------------------------------
Total Files: 150
Total Lines of Code: 25,000
Total Size: 1.5 MB

BY CATEGORY
----------------------------------------
  source              100 files,     22,000 lines,    900 KB
  test                 30 files,      5,000 lines,    200 KB
  config               10 files,        500 lines,     50 KB
  documentation         5 files,      1,000 lines,    100 KB
  other                 5 files,        200 lines,     20 KB

TECH STACK
----------------------------------------
  TypeScript, Node.js, Express, React

DEPENDENCIES
----------------------------------------
  Production: 15
  Development: 10

MAIN FILES
----------------------------------------
  - src/index.ts
  - src/app.ts
```

### JSON Format

```json
{
  "path": "/path/to/project",
  "name": "project-name",
  "stats": {
    "totalFiles": 150,
    "totalLinesOfCode": 25000,
    "totalSize": 1572864,
    "byExtension": {
      ".ts": { "files": 80, "lines": 20000, "size": 800000 }
    },
    "byCategory": {
      "source": { "files": 100, "lines": 22000, "size": 900000 }
    }
  },
  "dependencies": [
    { "name": "express", "version": "4.18.0", "type": "production" }
  ],
  "techStack": ["TypeScript", "Node.js", "Express"],
  "structure": ["src/", "tests/", "package.json"],
  "mainFiles": ["src/index.ts"],
  "generatedAt": "2026-04-06T12:00:00Z"
}
```

## Supported Dependency Files

| Language | Files |
|----------|-------|
| Node.js | package.json |
| Python | requirements.txt, Pipfile, pyproject.toml, setup.py |
| Go | go.mod |
| Rust | Cargo.toml |
| Ruby | Gemfile |
| PHP | composer.json |

## File Categories

| Category | Description |
|----------|-------------|
| source | Source code files (.ts, .js, .py, .go, etc.) |
| test | Test files (*.test.*, *.spec.*, *_test.*) |
| config | Configuration files (.json, .yaml, .toml, .env) |
| documentation | Documentation files (.md, .txt, .rst) |
| asset | Binary assets (.png, .jpg, .svg, fonts) |
| build | Build files (Dockerfile, Makefile, CI configs) |
| other | Everything else |

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev /path/to/project
```

## License

MIT