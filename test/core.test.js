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
    const flavor = String.fromEnvironment('FLAVOR')
  `, 'mixed.py');
  assert.deepEqual([...refs].sort(), ['CS_CONN', 'FLAVOR', 'PY_TOKEN']);
});

test('extractEnvRefs uses AST for JS env member access', () => {
  const refs = extractEnvRefs(`
    console.log(process
      .env
      .API_KEY);
    console.log(process.env['SECOND_KEY']);
  `, 'index.js');
  assert.deepEqual([...refs].sort(), ['API_KEY', 'SECOND_KEY']);
});

test('extractEnvRefs ignores JS comments and strings', () => {
  const refs = extractEnvRefs(`
    // process.env.FAKE_COMMENT
    const text = "process.env.FAKE_STRING";
    /* process.env.BLOCK_COMMENT */
    const real = process.env.REAL_KEY;
  `, 'index.js');
  assert.deepEqual([...refs].sort(), ['REAL_KEY']);
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
