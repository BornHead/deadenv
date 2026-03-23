import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const DEFAULT_ENV_FILES = ['.env', '.env.local', '.env.development', '.env.production', '.env.test', '.env.example'];
const DEFAULT_IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage', '.dart_tool', 'bin', 'obj']);
const CODE_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.cs', '.dart']);
const JS_LIKE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const NON_JS_CODE_PATTERNS = [
  /os\.getenv\(['"]([A-Z][A-Z0-9_]*)['"]/g,
  /os\.environ\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
  /Environment\.GetEnvironmentVariable\(['"]([A-Z][A-Z0-9_]*)['"]\)/g,
  /String\.fromEnvironment\(['"]([A-Z][A-Z0-9_]*)['"]\)/g,
  /Platform\.environment\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
  /dotenv(?:\.config\([^)]*\))?[\s\S]{0,120}?['"]([A-Z][A-Z0-9_]*)['"]/g
];

export function parseDotenv(content) {
  const keys = new Set();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const normalized = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
    const match = normalized.match(/^([A-Z][A-Z0-9_]*)\s*=/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function isIdentifier(node, name) {
  return node?.type === 'Identifier' && node.name === name;
}

function isStringLiteral(node) {
  return node?.type === 'StringLiteral' || node?.type === 'Literal';
}

function getStaticEnvKey(node) {
  if (!node) return null;
  if (!node.computed && node.property?.type === 'Identifier') {
    return /^[A-Z][A-Z0-9_]*$/.test(node.property.name) ? node.property.name : null;
  }
  if (node.computed && isStringLiteral(node.property) && typeof node.property.value === 'string') {
    return /^[A-Z][A-Z0-9_]*$/.test(node.property.value) ? node.property.value : null;
  }
  return null;
}

function isProcessEnvObject(node) {
  if (!node || (node.type !== 'MemberExpression' && node.type !== 'OptionalMemberExpression')) return false;
  return isIdentifier(node.object, 'process') && !node.computed && isIdentifier(node.property, 'env');
}

function jsParserPlugins(ext) {
  const plugins = ['importMeta'];
  if (ext === '.jsx' || ext === '.tsx') plugins.push('jsx');
  if (ext === '.ts' || ext === '.tsx') plugins.push('typescript');
  return plugins;
}

function traverseAst(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) traverseAst(item, visit);
      continue;
    }
    if (typeof value === 'object') traverseAst(value, visit);
  }
}

function extractJsEnvRefs(content, ext) {
  const refs = new Set();
  const ast = parse(content, {
    sourceType: 'unambiguous',
    errorRecovery: true,
    plugins: jsParserPlugins(ext)
  });

  traverseAst(ast, (node) => {
    if (node.type !== 'MemberExpression' && node.type !== 'OptionalMemberExpression') return;
    if (!isProcessEnvObject(node.object)) return;
    const key = getStaticEnvKey(node);
    if (key) refs.add(key);
  });

  return refs;
}

function extractPatternRefs(content, patterns) {
  const refs = new Set();
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) refs.add(match[1]);
  }
  return refs;
}

export function extractEnvRefs(content, filePath = '') {
  const ext = path.extname(filePath).toLowerCase();

  if (JS_LIKE_EXTENSIONS.has(ext)) {
    try {
      return extractJsEnvRefs(content, ext);
    } catch {
      return extractPatternRefs(content, [
        /process\.env\.([A-Z][A-Z0-9_]*)/g,
        /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
        ...NON_JS_CODE_PATTERNS
      ]);
    }
  }

  return extractPatternRefs(content, NON_JS_CODE_PATTERNS);
}

function walk(dir, collected = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (DEFAULT_IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, collected);
    else collected.push(fullPath);
  }
  return collected;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function analyzeProject(rootDir, options = {}) {
  const envFiles = options.envFiles?.length ? options.envFiles : DEFAULT_ENV_FILES;
  const allFiles = walk(rootDir);

  const envFileMap = new Map();
  const definedVars = new Set();
  const referencedVars = new Set();
  const referenceLocations = new Map();

  for (const filePath of allFiles) {
    const baseName = path.basename(filePath);
    const ext = path.extname(filePath);
    const relativePath = path.relative(rootDir, filePath) || filePath;

    if (envFiles.includes(baseName)) {
      const vars = parseDotenv(fs.readFileSync(filePath, 'utf8'));
      envFileMap.set(relativePath, uniqueSorted(vars));
      for (const key of vars) definedVars.add(key);
      continue;
    }

    if (!CODE_FILE_EXTENSIONS.has(ext)) continue;
    const refs = extractEnvRefs(fs.readFileSync(filePath, 'utf8'), filePath);
    for (const key of refs) {
      referencedVars.add(key);
      if (!referenceLocations.has(key)) referenceLocations.set(key, []);
      referenceLocations.get(key).push(relativePath);
    }
  }

  const unused = uniqueSorted([...definedVars].filter((key) => !referencedVars.has(key)));
  const missing = uniqueSorted([...referencedVars].filter((key) => !definedVars.has(key)));
  const referenced = uniqueSorted(referencedVars);
  const coverage = referenced.length ? Math.round(((referenced.length - missing.length) / referenced.length) * 100) : 100;

  return {
    rootDir,
    envFiles: Object.fromEntries(envFileMap),
    defined: uniqueSorted(definedVars),
    referenced,
    unused,
    missing,
    coverage,
    referenceLocations: Object.fromEntries(
      [...referenceLocations.entries()].map(([key, files]) => [key, uniqueSorted(files)])
    )
  };
}
