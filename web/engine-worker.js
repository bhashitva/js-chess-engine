let exports;
try {
  const { dotnet } = await import('./engine/_framework/dotnet.js');
  const runtime = await dotnet.create();
  exports = (await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName)).BhashBrowser;
  self.postMessage({ type: 'ready' });
} catch (error) { self.postMessage({ type: 'fatal', error: `Unable to load the Bhash browser runtime: ${error.message || error}` }); }

self.onmessage = ({ data }) => {
  if (!exports || data.type !== 'run') return;
  try {
    const code = exports.Run(data.input);
    if (code !== 0) throw new Error(exports.Errors() || 'The Bhash engine rejected this position or move.');
    self.postMessage({ type: 'result', id: data.id, snapshot: JSON.parse(exports.Output().trim()) });
  } catch (error) { self.postMessage({ type: 'error', id: data.id, error: error.message || String(error) }); }
};
