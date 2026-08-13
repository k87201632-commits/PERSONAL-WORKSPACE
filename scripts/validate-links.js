#!/usr/bin/env node
// ==========================================================================
// PERSONAL-WORKSPACE — LINK VALIDATOR (VALIDATE-LINKS.JS)
// Resolves local .html hrefs per source file and checks targets exist.
// ==========================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const HTML_FILES = [];
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            walk(full);
        } else if (entry.name.endsWith('.html') || entry.name.endsWith('.js')) {
            HTML_FILES.push(full);
        }
    }
}
walk(ROOT);

const SKIP_FILES = new Set([
    'fixer.js', 'fixer2.js', 'remove_add_edit.js', 'clean_js.js',
]);

function isRootRelativeJs(sourceRel) {
    return sourceRel.startsWith('js' + path.sep) || sourceRel.startsWith('js/');
}

function resolveLocalHtml(fromFile, href) {
    if (!href || /^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) return null;

    const clean = href.split('#')[0].split('?')[0];
    if (!clean.endsWith('.html')) return null;

    const rel = path.relative(ROOT, fromFile).replace(/\\/g, '/');
    let fromDir;
    if (clean.startsWith('../') && rel === 'js/subject-page.js') {
        fromDir = path.join(ROOT, 'subjects');
    } else if (isRootRelativeJs(rel)) {
        fromDir = ROOT;
    } else {
        fromDir = path.dirname(fromFile);
    }
    return path.normalize(path.join(fromDir, clean));
}

function checkExists(absPath) {
    return fs.existsSync(absPath);
}

const broken = [];
const valid = [];
const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
const jsStrRe = /(?:navigateToPage|_nav|pwNavigate\.go|location\.href\s*=|window\.location\.href\s*=)\s*\(\s*['"]([^'"]+\.html[^'"]*)['"]/g;
const jsTplRe = /`([^`]*subjects\/[^`]+\.html[^`]*)`/g;

for (const file of HTML_FILES) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (SKIP_FILES.has(path.basename(file))) continue;
    const content = fs.readFileSync(file, 'utf8');

    let m;
    hrefRe.lastIndex = 0;
    while ((m = hrefRe.exec(content)) !== null) {
        const target = resolveLocalHtml(file, m[1]);
        if (!target) continue;
        const entry = { source: rel, href: m[1], expected: path.relative(ROOT, target).replace(/\\/g, '/') };
        if (checkExists(target)) valid.push(entry);
        else broken.push(entry);
    }

    if (!file.endsWith('.js')) continue;

    jsStrRe.lastIndex = 0;
    while ((m = jsStrRe.exec(content)) !== null) {
        const href = m[1];
        const target = resolveLocalHtml(file, href);
        if (!target) continue;
        const entry = { source: rel, href, expected: path.relative(ROOT, target).replace(/\\/g, '/'), kind: 'js-literal' };
        if (checkExists(target)) valid.push(entry);
        else broken.push(entry);
    }

    jsTplRe.lastIndex = 0;
    while ((m = jsTplRe.exec(content)) !== null) {
        const href = m[1].replace(/\$\{[^}]+\}/g, 'placeholder.html').replace(/placeholder\.html/g, 'informatika.html');
        if (!href.includes('.html')) continue;
        const target = resolveLocalHtml(file, href);
        if (!target) continue;
        const entry = { source: rel, href: m[1], expected: path.relative(ROOT, target).replace(/\\/g, '/'), kind: 'js-template' };
        if (checkExists(target)) valid.push(entry);
        else broken.push(entry);
    }
}

// Simulate resolveSiteUrl from subjects pages for root-relative JS routes
const JS_ROOT_ROUTES = [
    'index.html', 'jadwal.html', 'tugas.html', 'pelajaran.html', 'profil.html', 'arcade.html',
];
const subjectFiles = fs.readdirSync(path.join(ROOT, 'subjects')).filter(f => f.endsWith('.html'));
for (const sub of subjectFiles) {
    const from = path.join(ROOT, 'subjects', sub);
    for (const route of JS_ROOT_ROUTES) {
        const resolved = path.normalize(path.join(path.dirname(from), '..', route));
        const entry = { source: `subjects/${sub} (JS resolve)`, href: route, expected: path.relative(ROOT, resolved).replace(/\\/g, '/') };
        if (checkExists(resolved)) valid.push(entry);
        else broken.push(entry);
    }
    for (const sf of subjectFiles) {
        const href = `subjects/${sf}`;
        const resolved = path.normalize(path.join(path.dirname(from), '..', href));
        const entry = { source: `subjects/${sub} (JS resolve)`, href, expected: path.relative(ROOT, resolved).replace(/\\/g, '/') };
        if (checkExists(resolved)) valid.push(entry);
        else broken.push(entry);
    }
}

console.log('=== PERSONAL-WORKSPACE LINK VALIDATION ===');
console.log(`HTML/JS files scanned: ${HTML_FILES.length}`);
console.log(`Valid local links: ${valid.length}`);
console.log(`Broken links: ${broken.length}`);

if (broken.length) {
    console.log('\n--- BROKEN ---');
    broken.forEach(b => {
        console.log(`❌ source: ${b.source}`);
        console.log(`   target: ${b.href}`);
        console.log(`   expected file: ${b.expected}`);
    });
    process.exit(1);
}

console.log('\n✅ All resolved local HTML links exist.');
process.exit(0);
