# Clean up stray Hexo processes left behind by an interrupted build.
# Only touches node.exe processes whose command line is "hexo clean|generate|deploy",
# so a running "hexo server" (preview) is left alone.
$killed = 0
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ForEach-Object {
  $cmd = $_.CommandLine
  if ($cmd -and $cmd -match 'hexo' -and $cmd -match '\s(clean|generate|deploy)(\s|$)') {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      Write-Host ("  cleaned up leftover hexo process: PID " + $_.ProcessId)
      $killed++
    } catch { }
  }
}
if ($killed -eq 0) { Write-Host "  no leftover process" }
