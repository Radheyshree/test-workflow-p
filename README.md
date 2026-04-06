# test-workflow-p

## Codebase Summary Tool

A tool to analyze and generate comprehensive summaries of codebases.

### Usage

```bash
python3 scripts/summarize.py [repo_path] [-o OUTPUT_FILE]
```

**Arguments:**
- `repo_path` - Path to the repository (default: current directory)
- `-o, --output` - Output file path (default: CODEBASE_SUMMARY.md)
- `-v, --verbose` - Enable verbose output

### Examples

```bash
# Summarize current directory
python3 scripts/summarize.py

# Summarize a specific project
python3 scripts/summarize.py /path/to/project -o SUMMARY.md

# Verbose mode
python3 scripts/summarize.py -v
```

### Features

- Directory structure visualization
- Language detection and file type analysis
- Dependency extraction (Python, npm, Cargo, Go)
- Python class/function extraction
- JavaScript/TypeScript export detection
- Entry point identification
- Configuration file detection

### Installation

```bash
pip install -r requirements.txt
```