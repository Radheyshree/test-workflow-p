import * as fs from 'fs';
import * as path from 'path';
import { DependencyInfo } from './types';

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

interface PythonRequirements {
  name: string;
  version: string;
}

export class DependencyParser {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  parse(): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    dependencies.push(...this.parsePackageJson());
    dependencies.push(...this.parseRequirementsTxt());
    dependencies.push(...this.parseGoMod());
    dependencies.push(...this.parseCargoToml());
    dependencies.push(...this.parseGemfile());
    dependencies.push(...this.parseComposerJson());

    return dependencies;
  }

  private parsePackageJson(): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const packageJsonPath = path.join(this.basePath, 'package.json');

    try {
      if (!fs.existsSync(packageJsonPath)) return dependencies;

      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const pkg: PackageJson = JSON.parse(content);

      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.push({
            name,
            version: version || 'unknown',
            type: 'production',
          });
        }
      }

      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.push({
            name,
            version: version || 'unknown',
            type: 'development',
          });
        }
      }

      if (pkg.peerDependencies) {
        for (const [name, version] of Object.entries(pkg.peerDependencies)) {
          dependencies.push({
            name,
            version: version || 'unknown',
            type: 'production',
          });
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return dependencies;
  }

  private parseRequirementsTxt(): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const requirementsPath = path.join(this.basePath, 'requirements.txt');

    try {
      if (!fs.existsSync(requirementsPath)) return dependencies;

      const content = fs.readFileSync(requirementsPath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) {
          continue;
        }

        const parsed = this.parsePythonRequirement(trimmed);
        if (parsed) {
          dependencies.push({
            name: parsed.name,
            version: parsed.version,
            type: 'production',
          });
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return dependencies;
  }

  private parsePythonRequirement(line: string): PythonRequirements | null {
    const patterns = [
      /^([a-zA-Z0-9_-]+)\s*==\s*([^;]+)/,
      /^([a-zA-Z0-9_-]+)\s*>=\s*([^;]+)/,
      /^([a-zA-Z0-9_-]+)\s*<=\s*([^;]+)/,
      /^([a-zA-Z0-9_-]+)\s*>\s*([^;]+)/,
      /^([a-zA-Z0-9_-]+)\s*<\s*([^;]+)/,
      /^([a-zA-Z0-9_-]+)\s*~=([^;]+)/,
      /^([a-zA-Z0-9_-]+)\[(.+?)\]\s*==\s*([^;]+)/,
      /^([a-zA-Z0-9_-]+)$/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          name: match[1],
          version: match[2] || 'latest',
        };
      }
    }

    return null;
  }

  private parseGoMod(): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const goModPath = path.join(this.basePath, 'go.mod');

    try {
      if (!fs.existsSync(goModPath)) return dependencies;

      const content = fs.readFileSync(goModPath, 'utf-8');
      const lines = content.split('\n');
      let inRequire = false;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === 'require (') {
          inRequire = true;
          continue;
        }

        if (trimmed === ')' && inRequire) {
          inRequire = false;
          continue;
        }

        if (trimmed.startsWith('require ')) {
          const parts = trimmed.slice(8).split(/\s+/);
          if (parts.length >= 2) {
            dependencies.push({
              name: parts[0],
              version: parts[1],
              type: 'production',
            });
          }
          continue;
        }

        if (inRequire) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2 && !trimmed.startsWith('//')) {
            dependencies.push({
              name: parts[0],
              version: parts[1],
              type: 'production',
            });
          }
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return dependencies;
  }

  private parseCargoToml(): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const cargoPath = path.join(this.basePath, 'Cargo.toml');

    try {
      if (!fs.existsSync(cargoPath)) return dependencies;

      const content = fs.readFileSync(cargoPath, 'utf-8');
      const lines = content.split('\n');
      let inDependencies = false;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '[dependencies]') {
          inDependencies = true;
          continue;
        }

        if (trimmed.startsWith('[') && trimmed !== '[dependencies]') {
          inDependencies = false;
          continue;
        }

        if (inDependencies && trimmed.includes('=')) {
          const [namePart, versionPart] = trimmed.split('=').map(s => s.trim());
          const name = namePart.replace(/"/g, '');

          let version = 'unknown';
          const versionMatch = versionPart.match(/version\s*=\s*"([^"]+)"/);
          if (versionMatch) {
            version = versionMatch[1];
          } else if (versionPart.startsWith('"')) {
            version = versionPart.replace(/"/g, '');
          }

          dependencies.push({
            name,
            version,
            type: 'production',
          });
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return dependencies;
  }

  private parseGemfile(): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const gemfilePath = path.join(this.basePath, 'Gemfile');

    try {
      if (!fs.existsSync(gemfilePath)) return dependencies;

      const content = fs.readFileSync(gemfilePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('gem ')) {
          const match = trimmed.match(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
          if (match) {
            dependencies.push({
              name: match[1],
              version: match[2] || 'latest',
              type: 'production',
            });
          }
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return dependencies;
  }

  private parseComposerJson(): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const composerPath = path.join(this.basePath, 'composer.json');

    try {
      if (!fs.existsSync(composerPath)) return dependencies;

      const content = fs.readFileSync(composerPath, 'utf-8');
      const composer = JSON.parse(content);

      if (composer.require) {
        for (const [name, version] of Object.entries(composer.require)) {
          if (name === 'php') continue;
          dependencies.push({
            name,
            version: version as string,
            type: 'production',
          });
        }
      }

      if (composer['require-dev']) {
        for (const [name, version] of Object.entries(composer['require-dev'])) {
          dependencies.push({
            name,
            version: version as string,
            type: 'development',
          });
        }
      }
    } catch {
      // Ignore parsing errors
    }

    return dependencies;
  }

  getDependencyCount(): { production: number; development: number } {
    const deps = this.parse();
    return {
      production: deps.filter(d => d.type === 'production').length,
      development: deps.filter(d => d.type === 'development').length,
    };
  }
}