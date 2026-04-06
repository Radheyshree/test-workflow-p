#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { Analyzer } from './analyzer';
import { ReportGenerator } from './reportGenerator';
import { ReportOptions } from './types';
import { writeFile } from './utils';

const program = new Command();

program
  .name('codebase-summary')
  .description('Analyze and summarize a code repository')
  .version('1.0.0')
  .argument('[path]', 'Path to the codebase', '.')
  .option('-f, --format <format>', 'Output format (json, text, markdown)', 'text')
  .option('-o, --output <file>', 'Output file path')
  .option('-e, --exclude <patterns>', 'Additional exclude patterns (comma-separated)')
  .option('-d, --max-depth <depth>', 'Maximum directory depth', '20')
  .action(async (targetPath: string, options: {
    format: string;
    output?: string;
    exclude?: string;
    maxDepth: string;
  }) => {
    try {
      const absolutePath = path.resolve(targetPath);

      if (!fs.existsSync(absolutePath)) {
        console.error(`Error: Path does not exist: ${absolutePath}`);
        process.exit(1);
      }

      if (!fs.statSync(absolutePath).isDirectory()) {
        console.error(`Error: Path is not a directory: ${absolutePath}`);
        process.exit(1);
      }

      const excludePatterns = options.exclude
        ? options.exclude.split(',').map(p => p.trim())
        : [];

      const maxDepth = parseInt(options.maxDepth, 10);
      if (isNaN(maxDepth) || maxDepth < 1) {
        console.error('Error: max-depth must be a positive integer');
        process.exit(1);
      }

      const validFormats = ['json', 'text', 'markdown'];
      if (!validFormats.includes(options.format)) {
        console.error(`Error: Invalid format "${options.format}". Valid formats: ${validFormats.join(', ')}`);
        process.exit(1);
      }

      console.log(`Analyzing codebase at: ${absolutePath}`);
      console.log('');

      const analyzer = new Analyzer({
        path: absolutePath,
        excludePatterns,
        maxDepth,
      });

      const summary = await analyzer.analyze();

      const reportOptions: ReportOptions = {
        format: options.format as 'json' | 'text' | 'markdown',
        outputPath: options.output,
      };

      const generator = new ReportGenerator(summary);
      const report = generator.generate(reportOptions);

      if (options.output) {
        writeFile(options.output, report);
        console.log(`Report written to: ${options.output}`);
      } else {
        console.log(report);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();