param(
  [ValidateSet('Install','Remove','Start','Stop','Status')][string]$Action = 'Status',
  [ValidateSet('Boot','Logon')][string]$Startup = 'Boot',
  [string]$StateDirectory = (Join-Path $env:LOCALAPPDATA 'TAKT-Pi-Server')
)
$ErrorActionPreference = 'Stop'
$taskName = 'TAKT-Pi-Server'
if ($Action -eq 'Install') {
  $config = Get-Content -LiteralPath (Join-Path $StateDirectory 'server.json') -Raw | ConvertFrom-Json
  $env:TAKT_SERVER_STATE = $StateDirectory
  & $config.node (Join-Path $PSScriptRoot 'standalone.cjs') check
  if ($LASTEXITCODE) { throw 'Server configuration check failed' }
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  if ($Startup -eq 'Boot' -and !([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Boot installation requires an elevated PowerShell. Use -Startup Logon for current-user sign-in startup.' }
  # Retain the user profile's inherited ACLs, including restricted execution identities.
  & icacls.exe $StateDirectory /grant:r "*$($identity.User.Value):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' /T /Q | Out-Null
  if ($LASTEXITCODE) { throw 'Could not protect the private state directory' }
  $runner = Join-Path $StateDirectory 'run.ps1'
  $escapedState = $StateDirectory.Replace("'", "''")
  $escapedNode = $config.node.Replace("'", "''")
  $escapedScript = (Join-Path $PSScriptRoot 'standalone.cjs').Replace("'", "''")
  @"
`$env:TAKT_SERVER_STATE = '$escapedState'
& '$escapedNode' '$escapedScript'
exit `$LASTEXITCODE
"@ | Set-Content -LiteralPath $runner -Encoding UTF8
  $taskAction = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runner`"" -WorkingDirectory $PSScriptRoot
  if ($Startup -eq 'Boot') {
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId $identity.Name -LogonType S4U -RunLevel Limited
  } else {
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $identity.Name
    $principal = New-ScheduledTaskPrincipal -UserId $identity.Name -LogonType Interactive -RunLevel Limited
  }
  $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
  Start-ScheduledTask -TaskName $taskName
  Write-Output "Installed $Startup startup. Private configuration: $StateDirectory"
} elseif ($Action -eq 'Remove') {
  Stop-ScheduledTask -TaskName $taskName
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
} elseif ($Action -eq 'Start') { Start-ScheduledTask -TaskName $taskName
} elseif ($Action -eq 'Stop') { Stop-ScheduledTask -TaskName $taskName
} else { Get-ScheduledTask -TaskName $taskName; Get-ScheduledTaskInfo -TaskName $taskName }
