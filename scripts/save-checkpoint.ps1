param([Parameter(Mandatory=$true)][string]$Name)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$checkpointRoot = Join-Path $projectRoot 'checkpoints'
New-Item -ItemType Directory -Force -Path $checkpointRoot | Out-Null
$stamp = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(3)).ToString('yyyy-MM-dd_HH-mm-ss')
$archivePath = Join-Path $checkpointRoot ($Name + ' — ' + $stamp + '.zip')
$files = @(Get-ChildItem -LiteralPath $projectRoot -File -Force)
foreach ($folder in @('src','public','design','scripts','.github')) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $folder))) { continue }
  $files += Get-ChildItem -LiteralPath (Join-Path $projectRoot $folder) -Recurse -File -Force | Where-Object { $_.Extension -notin @('.tmp','.log','.base64') }
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
$manifest = @()
try {
  foreach ($file in $files) {
    $relative = $file.FullName.Substring($projectRoot.Length+1).Replace('\','/')
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$file.FullName,$relative,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $manifest += [PSCustomObject]@{path=$relative;bytes=$file.Length;sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash}
  }
  $entry = $archive.CreateEntry('CHECKPOINT.json')
  $writer = [IO.StreamWriter]::new($entry.Open(),[Text.UTF8Encoding]::new($false))
  try { $writer.Write(([PSCustomObject]@{name=$Name;created=$stamp;excluded=@('node_modules','dist','artifacts','checkpoints','*.tmp','*.log','*.base64');files=$manifest} | ConvertTo-Json -Depth 5)) } finally {$writer.Dispose()}
} finally {$archive.Dispose()}
$verification = [IO.Compression.ZipFile]::OpenRead($archivePath)
try {
  foreach ($record in $manifest) {
    $stream = $verification.GetEntry($record.path).Open()
    $hasher = [Security.Cryptography.SHA256]::Create()
    try {
      $actual = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-','')
      if ($actual -ne $record.sha256) {throw ('Checkpoint hash mismatch: '+$record.path)}
    } finally {$stream.Dispose();$hasher.Dispose()}
  }
} finally {$verification.Dispose()}
[PSCustomObject]@{name=$Name;archive=$archivePath;files=$manifest.Count;verified=$true;sha256=(Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash} | ConvertTo-Json
