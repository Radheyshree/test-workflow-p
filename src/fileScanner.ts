import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';
import {
  FileInfo,
  FileCategory,
  SOURCE_EXTENSIONS,
  TEST_PATTERNS,
  CONFIG_EXTENSIONS,
  CONFIG_PATTERNS,
  DOCUMENTATION_EXTENSIONS,
  ASSET_EXTENSIONS,
  BUILD_FILES,
} from './types';
import {
  getFileExtension,
  isBinaryFile,
  isBinaryContent,
  countLines,
  normalizePath,
} from './utils';

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  'out/**',
  '.next/**',
  '.nuxt/**',
  'coverage/**',
  '.cache/**',
  'vendor/**',
  '__pycache__/**',
  '*.pyc',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '.env.local',
  '.env.*.local',
];

export class FileScanner {
  private basePath: string;
  private ignorePatterns: string[];
  private maxDepth: number;
  private ignoreManager: ReturnType<typeof ignore>;

  constructor(basePath: string, excludePatterns: string[] = [], maxDepth: number = 20) {
    this.basePath = normalizePath(basePath);
    this.ignorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...excludePatterns];
    this.maxDepth = maxDepth;
    this.ignoreManager = ignore().add(this.ignorePatterns);
    this.loadGitignore();
  }

  private loadGitignore(): void {
    const gitignorePath = path.join(this.basePath, '.gitignore');
    try {
      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        this.ignoreManager.add(content);
      }
    } catch {
      // Ignore errors reading .gitignore
    }
  }

  async scan(): Promise<FileInfo[]> {
    const files = await glob('**/*', {
      cwd: this.basePath,
      nodir: true,
      dot: true,
      ignore: ['node_modules', '.git'],
      maxDepth: this.maxDepth,
    });

    const fileInfos: FileInfo[] = [];

    for (const file of files) {
      const relativePath = normalizePath(file);
      if (this.shouldIgnore(relativePath)) {
        continue;
      }

      const fullPath = path.join(this.basePath, file);
      const info = await this.getFileInfo(fullPath, relativePath);
      if (info) {
        fileInfos.push(info);
      }
    }

    return fileInfos;
  }

  private shouldIgnore(relativePath: string): boolean {
    return this.ignoreManager.ignores(relativePath);
  }

  private async getFileInfo(fullPath: string, relativePath: string): Promise<FileInfo | null> {
    try {
      const stats = fs.statSync(fullPath);
      const extension = getFileExtension(fullPath);
      const category = this.categorizeFile(relativePath, extension);

      if (isBinaryFile(fullPath)) {
        return {
          path: fullPath,
          relativePath,
          extension,
          size: stats.size,
          linesOfCode: 0,
          category: 'asset',
        };
      }

      let linesOfCode = 0;
      try {
        const buffer = fs.readFileSync(fullPath);
        if (!isBinaryContent(buffer)) {
          const content = buffer.toString('utf-8');
          linesOfCode = countLines(content);
        }
      } catch {
        // If we can't read the file, just use 0 lines
      }

      return {
        path: fullPath,
        relativePath,
        extension,
        size: stats.size,
        linesOfCode,
        category,
      };
    } catch {
      return null;
    }
  }

  categorizeFile(relativePath: string, extension: string): FileCategory {
    const fileName = path.basename(relativePath).toLowerCase();
    const dirPath = path.dirname(relativePath).toLowerCase();

    if (BUILD_FILES.has(fileName) || BUILD_FILES.has(relativePath)) {
      return 'build';
    }

    for (const pattern of TEST_PATTERNS) {
      if (pattern.test(relativePath)) {
        return 'test';
      }
    }

    if (DOCUMENTATION_EXTENSIONS.has(extension)) {
      if (fileName === 'license' || fileName === 'changelog' || fileName === 'readme.md') {
        return 'documentation';
      }
      return 'documentation';
    }

    if (ASSET_EXTENSIONS.has(extension)) {
      return 'asset';
    }

    if (extension === '.json' || extension === '.yaml' || extension === '.yml' || extension === '.toml') {
      if (fileName.includes('package') || fileName.includes('tsconfig') || fileName.includes('cargo')) {
        return 'config';
      }
      if (dirPath.includes('test') || dirPath.includes('__tests__')) {
        return 'test';
      }
    }

    if (CONFIG_EXTENSIONS.has(extension)) {
      return 'config';
    }

    for (const pattern of CONFIG_PATTERNS) {
      if (pattern.test(fileName)) {
        return 'config';
      }
    }

    if (SOURCE_EXTENSIONS.has(extension)) {
      if (dirPath.includes('test') || dirPath.includes('__tests__') || dirPath.includes('spec')) {
        return 'test';
      }
      return 'source';
    }

    return 'other';
  }

  getDirectoryStructure(): string[] {
    const items: string[] = [];
    const seenDirs = new Set<string>();

    const scanDir = (dir: string, prefix: string = '') => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const sortedEntries = entries.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

        for (const entry of sortedEntries) {
          const name = entry.name;
          if (name === '.git' || name === 'node_modules') continue;

          const fullPath = path.join(dir, name);
          const relativePath = normalizePath(path.relative(this.basePath, fullPath));

          if (this.shouldIgnore(relativePath)) continue;

          if (entry.isDirectory()) {
            if (!seenDirs.has(relativePath)) {
              seenDirs.add(relativePath);
              items.push(prefix + name + '/');
              scanDir(fullPath, prefix + '  ');
            }
          } else {
            items.push(prefix + name);
          }
        }
      } catch {
        // Ignore permission errors
      }
    };

    scanDir(this.basePath);
    return items;
  }
}