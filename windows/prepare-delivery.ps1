$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$stage = Join-Path $PSScriptRoot 'runtime/delivery'
New-Item -ItemType Directory -Force $stage | Out-Null
# The published backend contains production assets: no developer checkout or home files.
$archive = Join-Path $stage 'pi-web.tgz'
Invoke-WebRequest 'https://registry.npmjs.org/@agegr/pi-web/-/pi-web-0.11.1.tgz' -OutFile $archive
$hasher = [Security.Cryptography.SHA512]::Create()
try { $digest = [Convert]::ToBase64String($hasher.ComputeHash([IO.File]::ReadAllBytes($archive))) } finally { $hasher.Dispose() }
if ($digest -ne 'fJxQxEtzeOs64v6OklqMADzgxatIcdn3lhSdlJkG2LlbieGLPzAT/hyHaylbZ8+2WvwpttLdKPtjPrYA834vzQ==') { throw 'Backend package integrity mismatch' }
tar -xf $archive -C $stage
if ($LASTEXITCODE) { throw 'Backend extraction failed' }
Remove-Item -LiteralPath (Join-Path $stage 'package/next.config.ts')
Copy-Item backend-config.cjs (Join-Path $stage 'package/next.config.js') -Force
$runtime = Join-Path $PSScriptRoot 'runtime/node_modules/node/bin/node.exe'
if (!(Test-Path $runtime)) {
  npm install --prefix runtime --no-save --no-audit --no-fund node@22.22.2
  if ($LASTEXITCODE) { throw 'Node runtime installation failed' }
}
Copy-Item $runtime (Join-Path $stage 'node.exe') -Force
$env:PATH = (Split-Path $runtime) + ';' + $env:PATH
$npmCli = Join-Path (Split-Path (Get-Command npm.cmd).Source) 'node_modules/npm/bin/npm-cli.js'
Copy-Item server-package-lock.json (Join-Path $stage 'package/package-lock.json') -Force
Push-Location (Join-Path $stage 'package')
try {
  & $runtime $npmCli ci --omit=dev --no-audit --no-fund
  if ($LASTEXITCODE) { throw 'Backend dependency installation failed' }
} finally { Pop-Location }
$notice = @('TAKT Pi GUI Windows 0.4.0', 'Bundled Node.js 22.22.2 (MIT and bundled third-party licenses)', 'Bundled pi-web 0.11.1 (MIT), pi coding agent and node-pty', 'Backend dependency versions: windows/server-package-lock.json', '')
$notice += Get-Content ../LICENSE
Invoke-WebRequest 'https://raw.githubusercontent.com/nodejs/node/v22.22.2/LICENSE' -OutFile (Join-Path $stage 'NODE-LICENSE.txt')
$notice += Get-Content (Join-Path $stage 'NODE-LICENSE.txt')
Get-ChildItem (Join-Path $stage 'package/node_modules') -Recurse -File -Include LICENSE,LICENSE.txt,LICENSE.md,COPYING | ForEach-Object { $notice += "`n--- $($_.FullName.Substring($stage.Length)) ---"; $notice += Get-Content -LiteralPath $_.FullName }
$notice | Set-Content (Join-Path $stage 'THIRD-PARTY-NOTICES.txt') -Encoding utf8
Write-Output 'Production backend and runtime prepared. Run npm run dist.'
