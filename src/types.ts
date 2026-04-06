export type FileCategory =
  | 'source'
  | 'test'
  | 'config'
  | 'documentation'
  | 'asset'
  | 'build'
  | 'other';

export interface FileInfo {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  linesOfCode: number;
  category: FileCategory;
}

export interface CategoryStats {
  files: number;
  lines: number;
  size: number;
}

export interface ExtensionStats {
  files: number;
  lines: number;
  size: number;
}

export interface CodeStats {
  totalFiles: number;
  totalLinesOfCode: number;
  totalSize: number;
  byExtension: Record<string, ExtensionStats>;
  byCategory: Record<FileCategory, CategoryStats>;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development';
}

export interface CodebaseSummary {
  path: string;
  name: string;
  stats: CodeStats;
  dependencies: DependencyInfo[];
  techStack: string[];
  structure: string[];
  mainFiles: string[];
  generatedAt: string;
}

export interface AnalyzerOptions {
  path: string;
  excludePatterns?: string[];
  maxDepth?: number;
}

export interface ReportOptions {
  format: 'json' | 'text' | 'markdown';
  outputPath?: string;
}

export const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.pyw',
  '.go',
  '.rs',
  '.java', '.kt', '.kts',
  '.rb', '.rake',
  '.php',
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp',
  '.cs',
  '.swift',
  '.scala', '.sc',
  '.clj', '.cljs',
  '.ex', '.exs',
  '.erl', '.hrl',
  '.hs',
  '.ml', '.mli',
  '.fs', '.fsi', '.fsx',
  '.vb',
  '.lua',
  '.r', '.rmd',
  '.sh', '.bash', '.zsh',
  '.ps1',
  '.sql',
  '.vue', '.svelte',
]);

export const TEST_PATTERNS = [
  /\.test\.[^.]+$/,
  /\.spec\.[^.]+$/,
  /_test\.[^.]+$/,
  /__tests__\//,
  /^test\//,
  /^tests\//,
  /^spec\//,
  /^specs\//,
];

export const CONFIG_EXTENSIONS = new Set([
  '.json', '.yaml', '.yml', '.toml', '.ini', '.env',
]);

export const CONFIG_PATTERNS = [
  /^\.env/,
  /rc$/,
  /\.config\.[^.]+$/,
  /^config\./,
];

export const DOCUMENTATION_EXTENSIONS = new Set([
  '.md', '.txt', '.rst', '.adoc', '.doc', '.docx',
]);

export const ASSET_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.webm',
  '.pdf', '.zip', '.tar', '.gz', '.rar',
]);

export const BUILD_FILES = new Set([
  'Makefile', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  '.dockerignore', 'Vagrantfile', 'Jenkinsfile', '.gitlab-ci.yml',
  '.travis.yml', 'azure-pipelines.yml', 'bitbucket-pipelines.yml',
]);

export const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.webm',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.node', '.wasm',
]);

export const DEPENDENCY_FILES = {
  node: ['package.json'],
  python: ['requirements.txt', 'Pipfile', 'pyproject.toml', 'setup.py'],
  go: ['go.mod'],
  rust: ['Cargo.toml'],
  java: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  ruby: ['Gemfile'],
  php: ['composer.json'],
  dotnet: ['*.csproj', '*.fsproj', '*.vbproj'],
};

export const TECH_STACK_INDICATORS: Record<string, string[]> = {
  TypeScript: ['tsconfig.json', '.ts'],
  JavaScript: ['package.json', '.js'],
  NodeJS: ['package.json'],
  Python: ['requirements.txt', 'setup.py', 'pyproject.toml', '.py'],
  Go: ['go.mod', '.go'],
  Rust: ['Cargo.toml', '.rs'],
  Java: ['pom.xml', 'build.gradle', '.java'],
  Ruby: ['Gemfile', '.rb'],
  PHP: ['composer.json', '.php'],
  DotNet: ['.csproj', '.fsproj', '.vbproj', '.cs', '.fs'],
  Docker: ['Dockerfile', 'docker-compose.yml'],
  Kubernetes: ['kubernetes/', 'k8s/', 'helm/', '.yaml'],
};