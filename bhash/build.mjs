import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const compiler = process.env.BHASH_COMPILER;
if (!compiler) throw new Error('Set BHASH_COMPILER to the extended bhash-compiler JAR (see README).');
const target = process.argv.includes('--clr') ? 'clr' : 'jvm';
const build = path.join(here, '../.bhash-build');
fs.mkdirSync(build, { recursive: true });
for (const [entry, output] of [['protocol', 'chess'], ['play', 'play']]) {
  const source = path.join(build, `${entry}.bhash`);
  fs.writeFileSync(source, fs.readFileSync(path.join(here, 'shatranj.bhash'), 'utf8') + '\n' + fs.readFileSync(path.join(here, `${entry}.bhash`), 'utf8'));
  const destination = path.join(here, target === 'clr' ? `${output}-clr` : `${output}.jar`);
  const result = spawnSync(process.env.BHASH_JAVA || 'java', ['-jar', compiler, 'compile', source, '--target', target, '-o', destination], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
}
