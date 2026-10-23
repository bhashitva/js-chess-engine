# Run the prebuilt static Bhash browser application. Players need only a browser.
$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath (Join-Path $PSScriptRoot 'web/dist/engine/_framework/dotnet.js'))) {
    throw 'Build the browser application first with npm run web:build. See web/README.md.'
}
$node = Get-Command node -ErrorAction SilentlyContinue
if (!$node) { throw 'Node.js is required only to serve the local files. Install Node.js, or deploy web/dist to a static host.' }
& $node.Source (Join-Path $PSScriptRoot 'web/serve.mjs')
exit $LASTEXITCODE
