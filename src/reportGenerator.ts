import { CodebaseSummary, ReportOptions, FileCategory } from './types';
import { formatBytes, formatNumber } from './utils';

export class ReportGenerator {
  private summary: CodebaseSummary;

  constructor(summary: CodebaseSummary) {
    this.summary = summary;
  }

  generate(options: ReportOptions): string {
    switch (options.format) {
      case 'json':
        return this.generateJson();
      case 'markdown':
        return this.generateMarkdown();
      case 'text':
      default:
        return this.generateText();
    }
  }

  private generateJson(): string {
    return JSON.stringify(this.summary, null, 2);
  }

  private generateText(): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push(`Codebase Summary: ${this.summary.name}`);
    lines.push('='.repeat(60));
    lines.push('');

    lines.push('OVERVIEW');
    lines.push('-'.repeat(40));
    lines.push(`Path: ${this.summary.path}`);
    lines.push(`Generated: ${this.summary.generatedAt}`);
    lines.push('');

    lines.push('STATISTICS');
    lines.push('-'.repeat(40));
    lines.push(`Total Files: ${formatNumber(this.summary.stats.totalFiles)}`);
    lines.push(`Total Lines of Code: ${formatNumber(this.summary.stats.totalLinesOfCode)}`);
    lines.push(`Total Size: ${formatBytes(this.summary.stats.totalSize)}`);
    lines.push('');

    lines.push('BY CATEGORY');
    lines.push('-'.repeat(40));
    const categoryStats = Object.entries(this.summary.stats.byCategory)
      .filter(([, data]) => data.files > 0)
      .sort((a, b) => b[1].files - a[1].files);

    for (const [category, data] of categoryStats) {
      lines.push(
        `  ${category.padEnd(15)} ${formatNumber(data.files).padStart(8)} files, ` +
        `${formatNumber(data.lines).padStart(10)} lines, ` +
        `${formatBytes(data.size).padStart(10)}`
      );
    }
    lines.push('');

    lines.push('BY EXTENSION (Top 10)');
    lines.push('-'.repeat(40));
    const extensionStats = Object.entries(this.summary.stats.byExtension)
      .sort((a, b) => b[1].lines - a[1].lines)
      .slice(0, 10);

    for (const [ext, data] of extensionStats) {
      lines.push(
        `  ${ext.padEnd(15)} ${formatNumber(data.files).padStart(8)} files, ` +
        `${formatNumber(data.lines).padStart(10)} lines`
      );
    }
    lines.push('');

    if (this.summary.techStack.length > 0) {
      lines.push('TECH STACK');
      lines.push('-'.repeat(40));
      lines.push(`  ${this.summary.techStack.join(', ')}`);
      lines.push('');
    }

    if (this.summary.dependencies.length > 0) {
      lines.push('DEPENDENCIES');
      lines.push('-'.repeat(40));
      const prodDeps = this.summary.dependencies.filter(d => d.type === 'production');
      const devDeps = this.summary.dependencies.filter(d => d.type === 'development');

      lines.push(`  Production: ${formatNumber(prodDeps.length)}`);
      lines.push(`  Development: ${formatNumber(devDeps.length)}`);

      if (prodDeps.length > 0) {
        lines.push('');
        lines.push('  Production Dependencies:');
        for (const dep of prodDeps.slice(0, 10)) {
          lines.push(`    - ${dep.name}@${dep.version}`);
        }
        if (prodDeps.length > 10) {
          lines.push(`    ... and ${prodDeps.length - 10} more`);
        }
      }
      lines.push('');
    }

    if (this.summary.mainFiles.length > 0) {
      lines.push('MAIN FILES');
      lines.push('-'.repeat(40));
      for (const file of this.summary.mainFiles) {
        lines.push(`  - ${file}`);
      }
      lines.push('');
    }

    if (this.summary.structure.length > 0) {
      lines.push('DIRECTORY STRUCTURE');
      lines.push('-'.repeat(40));
      const maxLines = 30;
      const structure = this.summary.structure.slice(0, maxLines);
      for (const item of structure) {
        lines.push(`  ${item}`);
      }
      if (this.summary.structure.length > maxLines) {
        lines.push(`  ... and ${this.summary.structure.length - maxLines} more items`);
      }
      lines.push('');
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  private generateMarkdown(): string {
    const lines: string[] = [];

    lines.push(`# Codebase Summary: ${this.summary.name}`);
    lines.push('');
    lines.push(`> Generated: ${this.summary.generatedAt}`);
    lines.push('');

    lines.push('## Overview');
    lines.push('');
    lines.push(`- **Path:** \`${this.summary.path}\``);
    lines.push(`- **Total Files:** ${formatNumber(this.summary.stats.totalFiles)}`);
    lines.push(`- **Total Lines of Code:** ${formatNumber(this.summary.stats.totalLinesOfCode)}`);
    lines.push(`- **Total Size:** ${formatBytes(this.summary.stats.totalSize)}`);
    lines.push('');

    lines.push('## Statistics by Category');
    lines.push('');
    lines.push('| Category | Files | Lines | Size |');
    lines.push('|----------|-------|-------|------|');

    const categoryStats = Object.entries(this.summary.stats.byCategory)
      .filter(([, data]) => data.files > 0)
      .sort((a, b) => b[1].files - a[1].files);

    for (const [category, data] of categoryStats) {
      lines.push(
        `| ${category} | ${formatNumber(data.files)} | ${formatNumber(data.lines)} | ${formatBytes(data.size)} |`
      );
    }
    lines.push('');

    lines.push('## Statistics by Extension (Top 10)');
    lines.push('');
    lines.push('| Extension | Files | Lines |');
    lines.push('|-----------|-------|-------|');

    const extensionStats = Object.entries(this.summary.stats.byExtension)
      .sort((a, b) => b[1].lines - a[1].lines)
      .slice(0, 10);

    for (const [ext, data] of extensionStats) {
      lines.push(`| ${ext || '(none)'} | ${formatNumber(data.files)} | ${formatNumber(data.lines)} |`);
    }
    lines.push('');

    if (this.summary.techStack.length > 0) {
      lines.push('## Tech Stack');
      lines.push('');
      for (const tech of this.summary.techStack) {
        lines.push(`- ${tech}`);
      }
      lines.push('');
    }

    if (this.summary.dependencies.length > 0) {
      lines.push('## Dependencies');
      lines.push('');

      const prodDeps = this.summary.dependencies.filter(d => d.type === 'production');
      const devDeps = this.summary.dependencies.filter(d => d.type === 'development');

      lines.push(`**Production Dependencies:** ${formatNumber(prodDeps.length)}`);
      lines.push(`**Development Dependencies:** ${formatNumber(devDeps.length)}`);
      lines.push('');

      if (prodDeps.length > 0) {
        lines.push('### Production Dependencies');
        lines.push('');
        lines.push('| Package | Version |');
        lines.push('|---------|---------|');
        for (const dep of prodDeps.slice(0, 20)) {
          lines.push(`| ${dep.name} | ${dep.version} |`);
        }
        if (prodDeps.length > 20) {
          lines.push(`| ... | _${prodDeps.length - 20} more_ |`);
        }
        lines.push('');
      }
    }

    if (this.summary.mainFiles.length > 0) {
      lines.push('## Main Files');
      lines.push('');
      for (const file of this.summary.mainFiles) {
        lines.push(`- \`${file}\``);
      }
      lines.push('');
    }

    if (this.summary.structure.length > 0) {
      lines.push('## Directory Structure');
      lines.push('');
      lines.push('```');
      const maxLines = 50;
      const structure = this.summary.structure.slice(0, maxLines);
      for (const item of structure) {
        lines.push(item);
      }
      if (this.summary.structure.length > maxLines) {
        lines.push(`... and ${this.summary.structure.length - maxLines} more items`);
      }
      lines.push('```');
      lines.push('');
    }

    return lines.join('\n');
  }
}