import * as fs from 'fs';
import * as path from 'path';
import { BINARY_EXTENSIONS } from './types';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return ext;
}

export function isBinaryFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  if (BINARY_EXTENSIONS.has(ext)) {
    return true;
  }
  const fileName = path.basename(filePath).toLowerCase();
  const binaryNames = ['license', 'changelog', 'authors', 'contributors'];
  if (binaryNames.includes(fileName)) {
    return false;
  }
  return false;
}

export function isBinaryContent(buffer: Buffer): boolean {
  const sampleSize = Math.min(buffer.length, 8192);
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    if (byte === 0) {
      return true;
    }
  }
  return false;
}

export function countLines(content: string): number {
  if (!content || content.length === 0) return 0;
  let count = 1;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') count++;
  }
  return count;
}

export function getProjectName(projectPath: string): string {
  return path.basename(projectPath);
}

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDirectory(dir);
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function readJsonFile<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

export function getRelativePath(basePath: string, filePath: string): string {
  return path.relative(basePath, filePath);
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function joinPaths(...paths: string[]): string {
  return normalizePath(path.join(...paths));
}