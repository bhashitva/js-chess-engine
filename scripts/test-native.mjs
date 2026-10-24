import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const clr = process.env.BHASH_TARGET === 'clr';
const executable = clr ? process.env.BHASH_DOTNET || 'dotnet' : process.env.BHASH_JAVA || 'java';
const artifact = fileURLToPath(new URL(clr ? '../bhash/tests-clr/BhashProgram.dll' : '../bhash/tests.jar', import.meta.url));
const result = spawnSync(executable, clr ? [artifact] : ['-Xmx512m', '-jar', artifact], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
