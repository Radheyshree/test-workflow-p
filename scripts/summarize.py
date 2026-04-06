#!/usr/bin/env python3
"""Codebase Summary Generator - Analyzes and summarizes a codebase."""

import argparse
import os
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple


IGNORE_PATTERNS = {
    '.git', '__pycache__', 'node_modules', '.venv', 'venv', 'env',
    '.env', 'dist', 'build', '.idea', '.vscode', '.tox', '.pytest_cache',
    '.mypy_cache', 'egg-info', '.eggs', 'site-packages', '.nox', 'htmlcov',
    '.coverage', '*.pyc', '*.pyo', '*.swp', '*.swo', '.DS_Store', 'Thumbs.db'
}

LANGUAGE_MAP = {
    '.py': 'Python',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (JSX)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (TSX)',
    '.java': 'Java',
    '.kt': 'Kotlin',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.c': 'C',
    '.cpp': 'C++',
    '.h': 'C/C++ Header',
    '.hpp': 'C++ Header',
    '.cs': 'C#',
    '.swift': 'Swift',
    '.m': 'Objective-C',
    '.scala': 'Scala',
    '.sh': 'Shell',
    '.bash': 'Shell',
    '.zsh': 'Shell',
    '.ps1': 'PowerShell',
    '.sql': 'SQL',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sass': 'Sass',
    '.less': 'Less',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.xml': 'XML',
    '.toml': 'TOML',
    '.ini': 'INI',
    '.cfg': 'Config',
    '.md': 'Markdown',
    '.rst': 'reStructuredText',
    '.txt': 'Text',
    '.dockerfile': 'Docker',
    '.makefile': 'Make',
    '.cmake': 'CMake',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
}

ENTRY_POINT_PATTERNS = [
    'main.py', 'app.py', 'run.py', 'server.py', 'wsgi.py', 'asgi.py',
    'index.js', 'index.ts', 'app.js', 'app.ts', 'server.js', 'server.ts',
    'main.go', 'main.rs', 'main.java', 'Main.java', 'index.rb',
    'main.kt', 'Main.kt', 'Program.cs',
]

CONFIG_FILES = {
    'package.json', 'requirements.txt', 'pyproject.toml', 'setup.py',
    'setup.cfg', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
    'Gemfile', 'composer.json', 'nuget.config', 'Podfile',
    'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
    '.env.example', 'config.yaml', 'config.yml', 'config.json',
    'Makefile', 'CMakeLists.txt', 'Vagrantfile',
}


class CodebaseAnalyzer:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path).resolve()
        self.files: List[Path] = []
        self.directories: Set[Path] = set()
        self.file_types: Dict[str, int] = defaultdict(int)
        self.languages: Dict[str, int] = defaultdict(int)
        self.entry_points: List[str] = []
        self.config_files_found: List[str] = []
        self.dependencies: Dict[str, List[str]] = defaultdict(list)
        self.readme_content: Optional[str] = None
        self.total_lines: int = 0
        self.python_metadata: Dict[str, List[str]] = {'classes': [], 'functions': []}
        self.js_metadata: Dict[str, List[str]] = {'exports': [], 'functions': []}

    def _should_ignore(self, path: Path) -> bool:
        for part in path.parts:
            if part in IGNORE_PATTERNS or part.startswith('.'):
                return True
        name = path.name.lower()
        for pattern in IGNORE_PATTERNS:
            if pattern.startswith('*') and name.endswith(pattern[1:]):
                return True
        return False

    def scan_directory(self) -> Dict:
        if not self.repo_path.exists():
            raise FileNotFoundError(f"Repository path not found: {self.repo_path}")

        for root, dirs, files in os.walk(self.repo_path):
            root_path = Path(root)
            dirs[:] = [d for d in dirs if not self._should_ignore(root_path / d)]

            for file in files:
                file_path = root_path / file
                if self._should_ignore(file_path):
                    continue

                rel_path = file_path.relative_to(self.repo_path)
                self.files.append(file_path)
                self.directories.add(file_path.parent)

                ext = file_path.suffix.lower()
                if ext:
                    self.file_types[ext] += 1
                    lang = LANGUAGE_MAP.get(ext)
                    if lang:
                        self.languages[lang] += 1

                if file in ENTRY_POINT_PATTERNS:
                    self.entry_points.append(str(rel_path))

                if file in CONFIG_FILES or file.lower() in CONFIG_FILES:
                    self.config_files_found.append(str(rel_path))

                if file.lower() == 'readme.md':
                    self._extract_readme(file_path)

        return {
            'files': len(self.files),
            'directories': len(self.directories),
            'file_types': dict(self.file_types),
            'languages': dict(self.languages),
        }

    def _extract_readme(self, file_path: Path) -> None:
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            lines = content.strip().split('\n')
            self.readme_content = '\n'.join(lines[:50])
        except Exception:
            pass

    def analyze_file_contents(self) -> None:
        for file_path in self.files:
            ext = file_path.suffix.lower()
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                self.total_lines += content.count('\n') + 1

                if ext == '.py':
                    self._extract_python_metadata(content, file_path)
                elif ext in ('.js', '.jsx', '.ts', '.tsx'):
                    self._extract_js_metadata(content, file_path)
                elif file_path.name in ('requirements.txt', 'requirements-dev.txt'):
                    self._parse_requirements(content)
                elif file_path.name == 'package.json':
                    self._parse_package_json(content)
                elif file_path.name == 'pyproject.toml':
                    self._parse_pyproject(content)
                elif file_path.name == 'Cargo.toml':
                    self._parse_cargo(content)
                elif file_path.name == 'go.mod':
                    self._parse_go_mod(content)
            except Exception:
                pass

    def _extract_python_metadata(self, content: str, file_path: Path) -> None:
        class_pattern = re.compile(r'^class\s+(\w+)', re.MULTILINE)
        func_pattern = re.compile(r'^def\s+(\w+)', re.MULTILINE)

        for match in class_pattern.finditer(content):
            self.python_metadata['classes'].append(f"{file_path.name}:{match.group(1)}")

        for match in func_pattern.finditer(content):
            func_name = match.group(1)
            if not func_name.startswith('_'):
                self.python_metadata['functions'].append(f"{file_path.name}:{func_name}")

    def _extract_js_metadata(self, content: str, file_path: Path) -> None:
        export_pattern = re.compile(r'export\s+(?:default\s+)?(?:function\s+)?(\w+)', re.MULTILINE)
        func_pattern = re.compile(r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()', re.MULTILINE)

        for match in export_pattern.finditer(content):
            self.js_metadata['exports'].append(f"{file_path.name}:{match.group(1)}")

        for match in func_pattern.finditer(content):
            name = match.group(1) or match.group(2)
            if name:
                self.js_metadata['functions'].append(f"{file_path.name}:{name}")

    def _parse_requirements(self, content: str) -> None:
        for line in content.strip().split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                match = re.match(r'^([a-zA-Z0-9_-]+)', line)
                if match:
                    self.dependencies['python'].append(match.group(1))

    def _parse_package_json(self, content: str) -> None:
        try:
            import json
            data = json.loads(content)
            deps = data.get('dependencies', {})
            dev_deps = data.get('devDependencies', {})
            for dep in {**deps, **dev_deps}:
                self.dependencies['npm'].append(dep)
        except Exception:
            pass

    def _parse_pyproject(self, content: str) -> None:
        deps_pattern = re.compile(r'^[a-zA-Z0-9_-]+', re.MULTILINE)
        in_deps = False
        for line in content.split('\n'):
            if 'dependencies' in line.lower():
                in_deps = True
            elif in_deps and line.strip().startswith('"'):
                match = re.match(r'^"([a-zA-Z0-9_-]+)', line.strip())
                if match:
                    self.dependencies['python'].append(match.group(1))
            elif in_deps and ']' in line:
                in_deps = False

    def _parse_cargo(self, content: str) -> None:
        dep_pattern = re.compile(r'^(\w+)\s*=', re.MULTILINE)
        in_deps = False
        for line in content.split('\n'):
            if '[dependencies]' in line:
                in_deps = True
            elif in_deps and line.strip().startswith('['):
                in_deps = False
            elif in_deps:
                match = dep_pattern.match(line.strip())
                if match:
                    self.dependencies['cargo'].append(match.group(1))

    def _parse_go_mod(self, content: str) -> None:
        require_pattern = re.compile(r'^\s*([a-zA-Z0-9./-]+)\s+v', re.MULTILINE)
        for match in require_pattern.finditer(content):
            self.dependencies['go'].append(match.group(1))

    def _build_tree(self) -> str:
        lines = []
        tree = {}

        for path in self.files:
            rel = path.relative_to(self.repo_path)
            parts = rel.parts
            current = tree
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    current[part] = None
                else:
                    if part not in current:
                        current[part] = {}
                    current = current[part]

        def render_tree(node: dict, prefix: str = '') -> None:
            items = sorted(node.items())
            for i, (name, children) in enumerate(items):
                is_last = (i == len(items) - 1)
                connector = '└── ' if is_last else '├── '
                if children is None:
                    lines.append(f"{prefix}{connector}{name}")
                else:
                    lines.append(f"{prefix}{connector}{name}/")
                    new_prefix = prefix + ('    ' if is_last else '│   ')
                    render_tree(children, new_prefix)

        lines.append(f"{self.repo_path.name}/")
        render_tree(tree)
        return '\n'.join(lines)

    def generate_summary(self) -> str:
        sections = []

        sections.append("# Codebase Summary\n")
        sections.append(f"**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        sections.append(f"**Repository:** {self.repo_path.name}\n")

        sections.append("## Project Overview\n")
        if self.readme_content:
            overview_lines = self.readme_content.split('\n')
            for line in overview_lines[:10]:
                sections.append(f"{line}\n")
        else:
            sections.append("No README.md found. Project overview unavailable.\n")

        sections.append("## Directory Structure\n")
        sections.append("```\n")
        sections.append(self._build_tree())
        sections.append("\n```\n")

        sections.append("## Technology Stack\n")
        if self.languages:
            sections.append("### Languages\n")
            for lang, count in sorted(self.languages.items(), key=lambda x: -x[1]):
                sections.append(f"- {lang}: {count} file(s)\n")
        else:
            sections.append("No recognized source code languages detected.\n")

        sections.append("## Dependencies\n")
        if self.dependencies:
            for dep_type, deps in sorted(self.dependencies.items()):
                if deps:
                    sections.append(f"### {dep_type.title()}\n")
                    for dep in sorted(set(deps))[:20]:
                        sections.append(f"- {dep}\n")
        else:
            sections.append("No dependency files found.\n")

        sections.append("## Key Files\n")
        if self.entry_points:
            sections.append("### Entry Points\n")
            for ep in self.entry_points:
                sections.append(f"- {ep}\n")

        if self.config_files_found:
            sections.append("### Configuration Files\n")
            for cf in self.config_files_found:
                sections.append(f"- {cf}\n")

        if self.python_metadata['classes'] or self.python_metadata['functions']:
            sections.append("## Python Components\n")
            if self.python_metadata['classes']:
                sections.append("### Classes\n")
                for cls in self.python_metadata['classes'][:15]:
                    sections.append(f"- {cls}\n")
            if self.python_metadata['functions']:
                sections.append("### Functions\n")
                for func in self.python_metadata['functions'][:15]:
                    sections.append(f"- {func}\n")

        if self.js_metadata['exports'] or self.js_metadata['functions']:
            sections.append("## JavaScript/TypeScript Components\n")
            if self.js_metadata['exports']:
                sections.append("### Exports\n")
                for exp in self.js_metadata['exports'][:15]:
                    sections.append(f"- {exp}\n")
            if self.js_metadata['functions']:
                sections.append("### Functions\n")
                for func in self.js_metadata['functions'][:15]:
                    sections.append(f"- {func}\n")

        sections.append("## Statistics\n")
        sections.append(f"- **Total Files:** {len(self.files)}\n")
        sections.append(f"- **Total Directories:** {len(self.directories)}\n")
        sections.append(f"- **Total Lines of Code:** {self.total_lines}\n")

        if self.file_types:
            sections.append("### File Types\n")
            for ext, count in sorted(self.file_types.items(), key=lambda x: -x[1])[:10]:
                sections.append(f"- {ext}: {count}\n")

        return ''.join(sections)


def main():
    parser = argparse.ArgumentParser(
        description='Generate a comprehensive summary of a codebase'
    )
    parser.add_argument(
        'repo_path',
        nargs='?',
        default='.',
        help='Path to the repository (default: current directory)'
    )
    parser.add_argument(
        '-o', '--output',
        default='CODEBASE_SUMMARY.md',
        help='Output file path (default: CODEBASE_SUMMARY.md)'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )

    args = parser.parse_args()

    repo_path = Path(args.repo_path).resolve()
    output_path = Path(args.output)

    if not repo_path.exists():
        print(f"Error: Repository path not found: {repo_path}")
        return 1

    if args.verbose:
        print(f"Analyzing repository: {repo_path}")

    analyzer = CodebaseAnalyzer(str(repo_path))

    try:
        analyzer.scan_directory()
        analyzer.analyze_file_contents()
        summary = analyzer.generate_summary()

        output_path.write_text(summary, encoding='utf-8')
        print(f"Summary generated: {output_path}")
        print(f"Files analyzed: {len(analyzer.files)}")

        return 0
    except Exception as e:
        print(f"Error generating summary: {e}")
        return 1


if __name__ == '__main__':
    exit(main())