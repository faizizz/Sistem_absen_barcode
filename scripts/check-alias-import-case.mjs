import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const aliasRoot = 'resources/js';
const aliasRootAbs = path.join(repoRoot, aliasRoot);

function walkFiles(dirAbs, out) {
    const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
    for (const entry of entries) {
        const abs = path.join(dirAbs, entry.name);
        if (entry.isDirectory()) {
            walkFiles(abs, out);
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
        out.push(rel);
    }
}

function readAliasFiles() {
    try {
        return execFileSync(
            'git',
            ['-c', `safe.directory=${repoRoot.replace(/\\/g, '/')}`, 'ls-files', aliasRoot],
            {
                cwd: repoRoot,
                encoding: 'utf8',
            },
        )
            .split(/\r?\n/)
            .filter(Boolean)
            .map((p) => p.replace(/\\/g, '/'));
    } catch {
        if (!fs.existsSync(aliasRootAbs)) {
            throw new Error(`Alias root not found: ${aliasRoot}`);
        }
        const files = [];
        walkFiles(aliasRootAbs, files);
        return files;
    }
}

const tracked = readAliasFiles();

const trackedSet = new Set(tracked);
const byLower = new Map();
for (const p of tracked) {
    const lower = p.toLowerCase();
    const list = byLower.get(lower) ?? [];
    list.push(p);
    byLower.set(lower, list);
}

const sourceFiles = tracked.filter((p) => /^resources\/js\/.*\.(js|jsx|ts|tsx|mjs|cjs)$/.test(p));
const exts = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json'];
const aliasRegex = /['"`]@\/([^'"`]+)['"`]/g;
const issues = [];

function hasExplicitExt(spec) {
    return path.posix.extname(spec) !== '';
}

function candidatePaths(specRel) {
    if (hasExplicitExt(specRel)) {
        return [`${aliasRoot}/${specRel}`];
    }
    const base = `${aliasRoot}/${specRel}`;
    const out = exts.map((ext) => `${base}${ext}`);
    for (const ext of exts) {
        out.push(`${base}/index${ext}`);
    }
    return out;
}

for (const file of sourceFiles) {
    const abs = path.join(repoRoot, file);
    const src = fs.readFileSync(abs, 'utf8');
    let match;
    while ((match = aliasRegex.exec(src)) !== null) {
        const specRel = match[1].replace(/\\/g, '/');
        const cleanSpec = specRel.split('?')[0].split('#')[0];
        const candidates = candidatePaths(cleanSpec);
        let ok = false;
        const caseSuggestions = new Set();

        for (const candidate of candidates) {
            if (trackedSet.has(candidate)) {
                ok = true;
                break;
            }
            const lowerHits = byLower.get(candidate.toLowerCase()) ?? [];
            for (const hit of lowerHits) {
                caseSuggestions.add(hit);
            }
        }

        if (!ok) {
            const detail =
                caseSuggestions.size > 0
                    ? `case mismatch, expected one of ${[...caseSuggestions].join(', ')}`
                    : `target not found under ${aliasRoot}`;
            issues.push(`${file}: "@/` + `${cleanSpec}" -> ${detail}`);
        }
    }
}

if (issues.length > 0) {
    console.error('Alias import case check failed:');
    for (const issue of issues) {
        console.error(`- ${issue}`);
    }
    process.exit(1);
}

console.log(`Alias import case check passed (${sourceFiles.length} files scanned).`);
