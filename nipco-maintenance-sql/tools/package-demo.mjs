/**
 * Post-processes the IIFE demo build (dist-demo) into artifacts that work when
 * opened directly from disk:
 *   1. demo-ui/                    - classic script (no ES-module CORS issues)
 *   2. NIPCO-demo-single-file.html - everything inlined into one file
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const src = join(root, 'dist-demo');
if (!existsSync(src)) {
  console.error('dist-demo not found - run `npm run build:demo` first.');
  process.exit(1);
}

const html = readFileSync(join(src, 'index.html'), 'utf8');

// A classic <script defer> works from file://, type="module" does not.
const classicHtml = html
  .replace('<script type="module" crossorigin src="./app.js"></script>',
           '<script defer src="./app.js"></script>')
  .replace('<link rel="stylesheet" crossorigin href="./app.css">',
           '<link rel="stylesheet" href="./app.css">');

// 1) multi-file demo folder
const outDir = join(root, 'demo-ui');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), classicHtml, 'utf8');
for (const file of ['app.js', 'app.css', 'favicon.svg', 'icons.svg']) {
  copyFileSync(join(src, file), join(outDir, file));
}

// 2) single-file html
const js = readFileSync(join(src, 'app.js'), 'utf8');
const css = readFileSync(join(src, 'app.css'), 'utf8');
const favicon = readFileSync(join(src, 'favicon.svg')).toString('base64');

const cssTag = '<link rel="stylesheet" href="./app.css">';
const jsTag = '<script defer src="./app.js"></script>';
const favTag = '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />';
for (const tag of [cssTag, jsTag, favTag]) {
  if (!classicHtml.includes(tag)) {
    console.error(`unexpected build output: missing ${tag}`);
    process.exit(1);
  }
}

// Inline the CSS and favicon where their tags are, and move the inlined JS to the
// end of <body>: an inline script ignores `defer`, so it must run after #root exists.
// Plain concatenation is used because js/css contain `$&`-style sequences that
// String.replace would treat as substitution patterns.
const styleTag = `<style>\n` + css + `\n</style>`;
const scriptTag = `<script>\n` + js + `\n</script>`;
const iconTag = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${favicon}" />`;

let single = classicHtml
  .split(jsTag).join('')
  .split(cssTag).join(styleTag)
  .split(favTag).join(iconTag);

if (!single.includes('</body>')) {
  console.error('unexpected build output: no </body>');
  process.exit(1);
}
single = single.replace('</body>', () => scriptTag + '\n  </body>'); // function form: js contains $-sequences

if (single.includes(cssTag) || single.includes(jsTag)) {
  console.error('single-file build still references external files');
  process.exit(1);
}

writeFileSync(join(root, 'NIPCO-demo-single-file.html'), single, 'utf8');

console.log(`demo-ui/ and NIPCO-demo-single-file.html written (${(single.length / 1024).toFixed(0)} KB single file)`);
