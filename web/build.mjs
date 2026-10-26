import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const web = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(web, '..');
const build = path.join(root, '.bhash-build');
const runtime = path.join(build, 'browser-runtime');
const dist = path.join(web, 'dist');
if (!process.env.BHASH_COMPILER) throw new Error('Set BHASH_COMPILER to the Bhash compiler JAR. See web/README.md.');
await fs.mkdir(build, { recursive: true });
const source = (await fs.readFile(path.join(root, 'bhash/shatranj.bhash'), 'utf8')) + '\n' + (await fs.readFile(path.join(root, 'bhash/web.bhash'), 'utf8'));
const input = path.join(build, 'browser.bhash');
await fs.writeFile(input, source);
const result = spawnSync(process.env.BHASH_JAVA || 'java', ['-jar', process.env.BHASH_COMPILER, 'compile', input, '--target', 'wasm-browser', '-o', runtime], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
if (path.dirname(dist) !== web || path.basename(dist) !== 'dist') throw new Error('Unexpected output path.');
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(path.join(dist, 'engine'), { recursive: true });
await fs.cp(path.join(runtime, '_framework'), path.join(dist, 'engine/_framework'), { recursive: true });
for (const file of ['index.html', 'bhash-analytics.js', 'styles.css', 'app.js', 'engine-client.js', 'engine-worker.js', 'pieces.js', 'presentation.js']) {
  await fs.copyFile(path.join(web, file), path.join(dist, file));
}
for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) await fs.copyFile(path.join(root, file), path.join(dist, file));
await fs.cp(path.join(web, 'runtime-notices'), path.join(dist, 'runtime-notices'), { recursive: true });
console.log(`Browser application built: ${dist}\nRun npm run web:serve, then open http://localhost:4173.`);
