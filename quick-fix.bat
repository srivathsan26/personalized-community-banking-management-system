@echo off
REM Quick fix for package.json duplicate key issue

echo Fixing package.json...

REM Using PowerShell to remove the problematic line
powershell -Command "^
  $file = 'package.json'; ^
  $content = Get-Content $file -Raw; ^
  $lines = $content -split \"`r`n\"; ^
  $fixed = $lines | Where-Object { $_ -notmatch 'powershell -Command' } | Join-String -Separator \"`r`n\"; ^
  $fixed | Set-Content $file; ^
  Write-Host 'Fixed: Removed duplicate powershell package:zip entry'
"

echo.
echo Installing PyInstaller...
pip install pyinstaller

echo.
echo Done! Now run: npm run desktop:package
