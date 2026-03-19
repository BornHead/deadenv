import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeProject, parseDotenv, extractEnvRefs } from '../src/core.js';

test('parseDotenv reads uppercase keys', () => {
  const vars = parseDotenv('FOO=1\nexport BAR=2\n# BAZ=3\n');
  assert.deepEqual([...vars].sort(), ['BAR', 'FOO']);
});

test('extractEnvRefs detects cross-stack references', () => {
  const refs = extractEnvRefs(`
    console.log(process.env.API_KEY);
    os.getenv('PY_TOKEN')
    Environment.GetEnvironmentVariable("CS_CONN")
    const String.fromEnvironment('FLAVOR')
  `);
  assert.deepEqual([...refs].sort(), ['API_KEY', 'CS_CONN', 'FLAVOR', 'PY_TOKEN']);
});

test('analyzeProject reports missing and unused vars', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deadenv-'));
  fs.writeFileSync(path.join(root, '.env'), 'USED=1\nUNUSED=1\n');
  fs.writeFileSync(path.join(root, 'index.js'), 'console.log(process.env.USED, process.env.MISSING)');

  const result = analyzeProject(root);
  assert.deepEqual(result.unused, ['UNUSED']);
  assert.deepEqual(result.missing, ['MISSING']);
  assert.equal(result.referenceLocations.MISSING[0], 'index.js');
});
