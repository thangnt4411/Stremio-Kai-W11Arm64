$DIST = "c:\Apps\stremio-build\dist\win-arm64"
if (Test-Path $DIST) {
    Write-Host "Clearing existing distribution folder (preserving WebView2 data)..."
    Get-ChildItem $DIST | Where-Object { $_.Name -ne "stremio.exe.WebView2" } | Remove-Item -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $DIST | Out-Null

Write-Host "1. Copying Stremio shell executable..."
Copy-Item "c:\Apps\stremio-build\build\Release\stremio.exe" -Destination $DIST\

Write-Host "2. Running windeployqt to deploy Qt dependencies..."
$windeployqt = "C:\Qt\6.11.1\msvc2022_arm64\bin\windeployqt.exe"
if (Test-Path $windeployqt) {
    & $windeployqt "$DIST\stremio.exe" --verbose 1
} else {
    Write-Error "windeployqt.exe not found at $windeployqt!"
    exit 1
}

Write-Host "3. Copying native ARM64 DLL dependencies..."
# libmpv
Copy-Item "c:\Apps\stremio-build\deps\libmpv\aarch64\libmpv-2.dll" -Destination $DIST\
# OpenSSL
Copy-Item "C:\Apps\Stremio-Kai\openssl-4.0.0.3\arm64\bin\libcrypto-4-arm64.dll" -Destination $DIST\
Copy-Item "C:\Apps\Stremio-Kai\openssl-4.0.0.3\arm64\bin\libssl-4-arm64.dll" -Destination $DIST\
# FFmpeg
Copy-Item "C:\Users\nttha\AppData\Local\Microsoft\WinGet\Packages\BtbN.FFmpeg.GPL_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-N-124714-g49a77d37be-winarm64-gpl\bin\ffmpeg.exe" -Destination $DIST\
Copy-Item "C:\Users\nttha\AppData\Local\Microsoft\WinGet\Packages\BtbN.FFmpeg.GPL_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-N-124714-g49a77d37be-winarm64-gpl\bin\ffprobe.exe" -Destination $DIST\

Write-Host "4. Copying streaming backend files (Node.js ARM64 + server.js)..."
Copy-Item "c:\Apps\stremio-build\utils\windows\stremio-runtime.exe" -Destination $DIST\
Copy-Item "c:\Apps\stremio-build\utils\windows\server.js" -Destination $DIST\

Write-Host "5. Overlaying Stremio-Kai config..."
$KAI_SRC = "c:\Apps\Stremio-Kai\portable_config"
$KAI_DST = "$DIST\portable_config"
if (Test-Path $KAI_SRC) {
    if (Test-Path $KAI_DST) {
        # Copy everything recursively except existing stremio-settings.ini
        Get-ChildItem $KAI_SRC -Recurse | ForEach-Object {
            $relative = $_.FullName.Substring($KAI_SRC.Length + 1)
            $targetPath = Join-Path $KAI_DST $relative
            if ($_.PsIsContainer) {
                New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
            } else {
                if ($relative -eq "stremio-settings.ini" -and (Test-Path $targetPath)) {
                    Write-Host "Preserving existing stremio-settings.ini..."
                } else {
                    Copy-Item $_.FullName -Destination $targetPath -Force
                }
            }
        }
    } else {
        Copy-Item -Recurse $KAI_SRC -Destination $KAI_DST
    }
    
    Write-Host "6. Removing SVP-related files from config (not supported on ARM64)..."
    Remove-Item "$KAI_DST\svp_main.vpy" -ErrorAction SilentlyContinue
    Remove-Item "$KAI_DST\scripts\svp_cleanup.lua" -ErrorAction SilentlyContinue
    Remove-Item "$KAI_DST\script-opts\svp.conf" -ErrorAction SilentlyContinue
} else {
    Write-Warning "Stremio-Kai portable_config folder not found!"
}

Write-Host "Deployment completed successfully! Target folder: $DIST"
