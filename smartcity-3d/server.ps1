# Mini web server de mo trang ma khong can XAMPP (chi dung PowerShell co san tren Windows).
# Cach dung: bam dup file MO-TRANG.bat nam cung thu muc. Dong cua so den de tat.
$ErrorActionPreference = 'Stop'
$root = (Split-Path -Parent $MyInvocation.MyCommand.Path).TrimEnd('\') + '\'
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'; '.webp' = 'image/webp'
  '.gif' = 'image/gif'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
  '.mp4' = 'video/mp4'; '.txt' = 'text/plain; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'
}

$listener = $null
foreach ($p in 5500..5520) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $listener = $l; $port = $p; break
  } catch { }
}
if (-not $listener) { Write-Host 'Khong mo duoc cong 5500-5520. Hay tat bot chuong trinh khac roi thu lai.'; Read-Host 'Nhan Enter de thoat'; exit 1 }

$url = "http://localhost:$port/"
Write-Host ''
Write-Host '=============================================='
Write-Host "  Trang dang chay tai: $url"
Write-Host '  Giu cua so nay mo trong luc xem trang.'
Write-Host '  Dong cua so nay de tat.'
Write-Host '=============================================='
Start-Process $url

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/') -replace '/', '\'
    if ($rel -eq '' -or $rel.EndsWith('\')) { $rel = $rel + 'index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if ($file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-cache')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
    }
  } catch {
    $res.StatusCode = 500
  } finally {
    $res.OutputStream.Close()
  }
}
