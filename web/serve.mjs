import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.dat': 'application/octet-stream' };
export function createStaticServer(directory) {
  const root = path.resolve(directory);
  return http.createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
      let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) || pathname.includes('\0')) { response.writeHead(403); response.end(); return; }
      const body = await fs.readFile(file);
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': body.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) { response.writeHead(error instanceof URIError ? 400 : 404); response.end('Not found'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
  try { await fs.access(path.join(directory, 'engine/_framework/dotnet.js')); }
  catch { throw new Error('Build the browser application first: npm run web:build'); }
  const port = Number(process.env.PORT || 4173);
  createStaticServer(directory).listen(port, '127.0.0.1', () => console.log(`Bhash Chess: http://localhost:${port}`));
}
