@echo off
echo Cleaning up old build artifacts...
if exist backend\build rmdir /s /q backend\build
if exist backend\dist rmdir /s /q backend\dist
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release
if exist dist-package rmdir /s /q dist-package

echo.
echo Starting fresh build...
npm run desktop:package

echo.
echo Build complete! Check for:
echo   - dist-package\Gramin-Connect-Hub-Setup.zip
echo   - release\Gramin Connect Hub-Setup-1.0.0.exe
