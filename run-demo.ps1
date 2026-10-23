# Run the native Bhash showcase using an installed Java 17+ runtime.
$ErrorActionPreference = 'Stop'
# The Bhash runtime reads/writes UTF-8 explicitly. Match the terminal and the
# PowerShell native-command pipe encoding, including Windows PowerShell 5.1.
$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
if ($env:OS -eq 'Windows_NT') { & chcp.com 65001 > $null }
$candidates = @()
if ($env:BHASH_JAVA) { $candidates += $env:BHASH_JAVA }
if ($env:JAVA_HOME) { $candidates += Join-Path $env:JAVA_HOME 'bin/java.exe' }
$onPath = Get-Command java -ErrorAction SilentlyContinue
if ($onPath) { $candidates += $onPath.Source }
foreach ($base in @("$env:ProgramFiles\Java", "$env:ProgramFiles\Eclipse Adoptium")) {
    if (Test-Path -LiteralPath $base) {
        $candidates += Get-ChildItem -LiteralPath $base -Directory | ForEach-Object { Join-Path $_.FullName 'bin/java.exe' }
    }
}
foreach ($candidate in $candidates | Select-Object -Unique) {
    if (!(Test-Path -LiteralPath $candidate)) { continue }
    $version = (& $candidate -version 2>&1 | Out-String)
    if ($version -match 'version "(\d+)' -and [int]$Matches[1] -ge 17) {
        & $candidate -jar (Join-Path $PSScriptRoot 'bhash/play.jar')
        exit $LASTEXITCODE
    }
}
throw 'Java 17+ is required. Install a current JDK or set BHASH_JAVA to its java executable.'
