$root     = 'C:\xampp\htdocs\gradeguru'
$frontend = "$root\frontend"
$zipPath  = "$root\gradeguru_cpanel.zip"

# ── Build React ───────────────────────────────────────────
Write-Host "Building React app..." -ForegroundColor Cyan
$result = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run build" `
    -WorkingDirectory $frontend `
    -Wait -PassThru -NoNewWindow
if ($result.ExitCode -ne 0) {
    Write-Host "Build FAILED. Aborting." -ForegroundColor Red
    exit 1
}
Write-Host "Build complete." -ForegroundColor Green

# ── Create ZIP ────────────────────────────────────────────
Write-Host "Creating deployment ZIP..." -ForegroundColor Cyan
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -Assembly 'System.IO.Compression.FileSystem'
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

function Add-Entry($zip, $file, $entry) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip, $file, $entry,
        [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
}

# 1. Root .htaccess
Add-Entry $zip "$root\.htaccess" '.htaccess'

# 2. React build → zip root
Get-ChildItem -Path "$frontend\dist" -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring("$frontend\dist\".Length)
    $entry = $rel.Replace('\','/')
    Add-Entry $zip $_.FullName $entry
}

# 3. Backend (skip .env, vendor, node_modules, *.log)
Get-ChildItem -Path "$root\backend" -Recurse -File | Where-Object {
    $p = $_.FullName
    $p -notmatch '\\vendor\\'        -and
    $p -notmatch '\\node_modules\\'  -and
    $_.Name -ne '.env'               -and
    $_.Extension -ne '.log'
} | ForEach-Object {
    $rel   = $_.FullName.Substring("$root\backend\".Length)
    $entry = 'backend/' + $rel.Replace('\','/')
    Add-Entry $zip $_.FullName $entry
}

$zip.Dispose()

# ── Summary ───────────────────────────────────────────────
$sizeKB = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host ""
Write-Host "=== ZIP ready ===" -ForegroundColor Green
Write-Host "Path : $zipPath"
Write-Host "Size : $sizeKB KB"
Write-Host ""

Add-Type -Assembly 'System.IO.Compression.FileSystem'
$zr      = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entries = $zr.Entries | Select-Object -ExpandProperty FullName | Sort-Object
$zr.Dispose()

Write-Host "--- Root files ---"
$entries | Where-Object { $_ -notmatch '/' } | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "--- Assets ---"
$entries | Where-Object { $_ -match '^assets/' } | ForEach-Object { Write-Host "  $_" }
Write-Host ""
$be = $entries | Where-Object { $_ -match '^backend/' }
Write-Host "--- Backend ($($be.Count) files) ---"
$be | ForEach-Object { Write-Host "  $_" }
