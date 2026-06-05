#!/usr/bin/env node
/*
 * Refactor helper — converts every relative import (./ or ../) under src/
 * to a `@/<path>` absolute import, resolved against the file's location.
 * Idempotent; safe to run multiple times.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');
const exts = new Set(['.js', '.jsx']);
const RE = /(from\s+['"]|import\(\s*['"])(\.{1,2}\/[^'"]+)(['"])/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

let touched = 0;
for (const file of walk(SRC)) {
  const code = fs.readFileSync(file, 'utf8');
  const newCode = code.replace(RE, (_m, pre, spec, post) => {
    const resolved = path.resolve(path.dirname(file), spec);
    const rel = path.relative(SRC, resolved).split(path.sep).join('/');
    return `${pre}@/${rel}${post}`;
  });
  if (newCode !== code) {
    fs.writeFileSync(file, newCode);
    touched++;
  }
}
console.log(`Updated ${touched} file(s).`);
