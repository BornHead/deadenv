import fs from 'node:fs';
import path from 'node:path';
import { analyzeProject } from './core.js';

function printList(title, values) {
  console.log(`\n${title}`);
  if (!values.length) {
    console.log('  - none');
    return;
  }
  for (const value of values) console.log(`  - ${value}`);
}

function printUsage() {
  console.log(`deadenv\n\nUsage:\n  deadenv scan [path] [--json]\n  deadenv example [path]\n\nExamples:\n  deadenv scan\n  deadenv scan . --json\n  deadenv example .\n  deadenv scan ../my-app\n`);
}

export async function runCli(args) {
  const [command = 'scan', maybePath, ...rest] = args;
  if (command === '--help' || command === '-h' || command === 'help') {
    printUsage();
    return;
  }

  if (command !== 'scan' && command !== 'example') {
    throw new Error(`Unknown command: ${command}`);
  }

  const json = [maybePath, ...rest].includes('--json');
  const targetPath = maybePath && !maybePath.startsWith('--') ? maybePath : '.';
  const rootDir = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(rootDir)) {
    throw new Error(`Path not found: ${rootDir}`);
  }

  const result = analyzeProject(rootDir);

  if (command === 'example') {
    for (const key of result.referenced) console.log(`${key}=`);
    return;
  }

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`deadenv scan: ${result.rootDir}`);
  console.log(`Detected env files: ${Object.keys(result.envFiles).length || 0}`);
  console.log(`Referenced env vars: ${result.referenced.length}`);
  console.log(`Unused env vars: ${result.unused.length}`);
  console.log(`Missing env vars: ${result.missing.length}`);

  if (Object.keys(result.envFiles).length) {
    console.log('\nEnv files');
    for (const [file, keys] of Object.entries(result.envFiles)) {
      console.log(`  - ${file} (${keys.length})`);
    }
  }

  printList('Unused env vars', result.unused);
  printList('Missing env vars', result.missing);

  if (result.missing.length) {
    console.log('\nMissing env var locations');
    for (const key of result.missing) {
      const files = result.referenceLocations[key] || [];
      console.log(`  - ${key}`);
      for (const file of files) console.log(`    - ${file}`);
    }
  }
}
