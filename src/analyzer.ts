import * as fs from 'fs';
import * as path from 'path';
import { FileInfo, CodebaseSummary, AnalyzerOptions, TECH_STACK_INDICATORS } from './types';
import { FileScanner } from './fileScanner';
import { StatsCollector } from './statsCollector';
import { DependencyParser } from './dependencyParser';
import { getProjectName, normalizePath } from './utils';

const MAIN_FILE_PATTERNS = [
  /^src\/index\.[^.]+$/,
  /^src\/main\.[^.]+$/,
  /^src\/app\.[^.]+$/,
  /^index\.[^.]+$/,
  /^main\.[^.]+$/,
  /^app\.[^.]+$/,
  /^main\/main\.[^.]+$/,
  /^cmd\/.*\/main\.go$/,
  /^lib\/main\.[^.]+$/,
];

const ARCHITECTURE_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /src\/controllers?\//, name: 'MVC' },
  { pattern: /src\/models?\//, name: 'MVC' },
  { pattern: /src\/views?\//, name: 'MVC' },
  { pattern: /src\/routes?\//, name: 'MVC' },
  { pattern: /src\/services?\//, name: 'Service Layer' },
  { pattern: /src\/repositories?\//, name: 'Repository Pattern' },
  { pattern: /packages?\//, name: 'Monorepo' },
  { pattern: /apps?\//, name: 'Monorepo' },
  { pattern: /services?\//, name: 'Microservices' },
  { pattern: /libs?\//, name: 'Modular' },
  { pattern: /core\//, name: 'Layered' },
  { pattern: /domain\//, name: 'Domain-Driven Design' },
  { pattern: /infrastructure\//, name: 'Domain-Driven Design' },
  { pattern: /application\//, name: 'Domain-Driven Design' },
  { pattern: /entities?\//, name: 'Domain-Driven Design' },
  { pattern: /use[_-]?cases?\//, name: 'Clean Architecture' },
  { pattern: /adapters?\//, name: 'Hexagonal Architecture' },
  { pattern: /ports?\//, name: 'Hexagonal Architecture' },
  { pattern: /components?\//, name: 'Component-Based' },
  { pattern: /pages?\//, name: 'Page-Based' },
  { pattern: /features?\//, name: 'Feature-Sliced' },
  { pattern: /modules?\//, name: 'Modular' },
];

export class Analyzer {
  private options: AnalyzerOptions;
  private fileScanner: FileScanner;
  private statsCollector: StatsCollector | null = null;
  private dependencyParser: DependencyParser;
  private files: FileInfo[] = [];

  constructor(options: AnalyzerOptions) {
    this.options = {
      excludePatterns: [],
      maxDepth: 20,
      ...options,
    };
    this.fileScanner = new FileScanner(
      this.options.path,
      this.options.excludePatterns,
      this.options.maxDepth
    );
    this.dependencyParser = new DependencyParser(this.options.path);
  }

  async analyze(): Promise<CodebaseSummary> {
    this.files = await this.fileScanner.scan();
    this.statsCollector = new StatsCollector(this.files);

    const stats = this.statsCollector.collect();
    const dependencies = this.dependencyParser.parse();
    const techStack = this.detectTechStack();
    const structure = this.fileScanner.getDirectoryStructure();
    const mainFiles = this.identifyMainFiles();

    return {
      path: normalizePath(this.options.path),
      name: getProjectName(this.options.path),
      stats,
      dependencies,
      techStack,
      structure: structure.slice(0, 100),
      mainFiles,
      generatedAt: new Date().toISOString(),
    };
  }

  private detectTechStack(): string[] {
    const techStack: Set<string> = new Set();

    for (const [tech, indicators] of Object.entries(TECH_STACK_INDICATORS)) {
      for (const indicator of indicators) {
        const hasIndicator = this.files.some(f =>
          f.relativePath.includes(indicator) ||
          f.extension === indicator ||
          f.relativePath.endsWith(indicator)
        );

        if (hasIndicator) {
          techStack.add(tech);
          break;
        }

        const fullPath = path.join(this.options.path, indicator);
        if (fs.existsSync(fullPath)) {
          techStack.add(tech);
          break;
        }
      }
    }

    if (this.files.some(f => f.relativePath.includes('react') || f.relativePath.includes('React'))) {
      techStack.add('React');
    }
    if (this.files.some(f => f.relativePath.includes('vue') || f.extension === '.vue')) {
      techStack.add('Vue');
    }
    if (this.files.some(f => f.extension === '.svelte')) {
      techStack.add('Svelte');
    }
    if (this.files.some(f => f.relativePath.includes('angular') || f.relativePath.includes('@angular'))) {
      techStack.add('Angular');
    }
    if (this.files.some(f => f.relativePath.includes('express'))) {
      techStack.add('Express');
    }
    if (this.files.some(f => f.relativePath.includes('next') || f.relativePath.includes('next.config'))) {
      techStack.add('Next.js');
    }
    if (this.files.some(f => f.relativePath.includes('nuxt'))) {
      techStack.add('Nuxt');
    }
    if (this.files.some(f => f.relativePath.includes('django'))) {
      techStack.add('Django');
    }
    if (this.files.some(f => f.relativePath.includes('flask'))) {
      techStack.add('Flask');
    }
    if (this.files.some(f => f.relativePath.includes('fastapi'))) {
      techStack.add('FastAPI');
    }

    return Array.from(techStack).sort();
  }

  private identifyMainFiles(): string[] {
    const mainFiles: string[] = [];

    for (const pattern of MAIN_FILE_PATTERNS) {
      const match = this.files.find(f => pattern.test(f.relativePath));
      if (match) {
        mainFiles.push(match.relativePath);
      }
    }

    if (mainFiles.length === 0) {
      const sourceFiles = this.files.filter(f => f.category === 'source');
      const indexFiles = sourceFiles.filter(f =>
        path.basename(f.relativePath).startsWith('index.')
      );

      if (indexFiles.length > 0) {
        mainFiles.push(...indexFiles.slice(0, 3).map(f => f.relativePath));
      }
    }

    return [...new Set(mainFiles)].slice(0, 5);
  }

  detectArchitecture(): string[] {
    const architectures: Set<string> = new Set();

    for (const file of this.files) {
      for (const { pattern, name } of ARCHITECTURE_PATTERNS) {
        if (pattern.test(file.relativePath)) {
          architectures.add(name);
        }
      }
    }

    return Array.from(architectures);
  }

  getFiles(): FileInfo[] {
    return this.files;
  }

  getSourceFiles(): FileInfo[] {
    return this.files.filter(f => f.category === 'source');
  }

  getTestFiles(): FileInfo[] {
    return this.files.filter(f => f.category === 'test');
  }
}