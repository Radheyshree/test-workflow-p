import { FileInfo, CodeStats, FileCategory, CategoryStats, ExtensionStats } from './types';

export class StatsCollector {
  private files: FileInfo[];

  constructor(files: FileInfo[]) {
    this.files = files;
  }

  collect(): CodeStats {
    const byExtension: Record<string, ExtensionStats> = {};
    const byCategory: Record<FileCategory, CategoryStats> = {
      source: { files: 0, lines: 0, size: 0 },
      test: { files: 0, lines: 0, size: 0 },
      config: { files: 0, lines: 0, size: 0 },
      documentation: { files: 0, lines: 0, size: 0 },
      asset: { files: 0, lines: 0, size: 0 },
      build: { files: 0, lines: 0, size: 0 },
      other: { files: 0, lines: 0, size: 0 },
    };

    let totalFiles = 0;
    let totalLinesOfCode = 0;
    let totalSize = 0;

    for (const file of this.files) {
      totalFiles++;
      totalLinesOfCode += file.linesOfCode;
      totalSize += file.size;

      const ext = file.extension || '(no extension)';
      if (!byExtension[ext]) {
        byExtension[ext] = { files: 0, lines: 0, size: 0 };
      }
      byExtension[ext].files++;
      byExtension[ext].lines += file.linesOfCode;
      byExtension[ext].size += file.size;

      byCategory[file.category].files++;
      byCategory[file.category].lines += file.linesOfCode;
      byCategory[file.category].size += file.size;
    }

    return {
      totalFiles,
      totalLinesOfCode,
      totalSize,
      byExtension,
      byCategory,
    };
  }

  getLargestFiles(count: number = 10): FileInfo[] {
    return [...this.files]
      .sort((a, b) => b.size - a.size)
      .slice(0, count);
  }

  getFilesWithMostLines(count: number = 10): FileInfo[] {
    return [...this.files]
      .sort((a, b) => b.linesOfCode - a.linesOfCode)
      .slice(0, count);
  }

  getExtensionStats(): Array<{ extension: string; files: number; lines: number; size: number }> {
    const stats = this.collect();
    return Object.entries(stats.byExtension)
      .map(([extension, data]) => ({
        extension,
        ...data,
      }))
      .sort((a, b) => b.lines - a.lines);
  }

  getCategoryStats(): Array<{ category: FileCategory; files: number; lines: number; size: number }> {
    const stats = this.collect();
    return Object.entries(stats.byCategory)
      .map(([category, data]) => ({
        category: category as FileCategory,
        ...data,
      }))
      .sort((a, b) => b.lines - a.lines);
  }

  getSourceFileCount(): number {
    return this.files.filter(f => f.category === 'source').length;
  }

  getTestFileCount(): number {
    return this.files.filter(f => f.category === 'test').length;
  }

  getTestToSourceRatio(): number {
    const sourceCount = this.getSourceFileCount();
    const testCount = this.getTestFileCount();
    if (sourceCount === 0) return 0;
    return testCount / sourceCount;
  }
}