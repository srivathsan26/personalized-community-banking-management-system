@echo off
cd /d "%~dp0"
echo.
echo Building Gramin Connect Hub Desktop App...
echo.
npm run desktop:package
echo.
echo.
echo ============================================================
echo Build complete! Check for errors above.
echo Files should be in:
echo   - release\Gramin Connect Hub-Setup-1.0.0.exe
echo   - dist-package\Gramin-Connect-Hub-Setup.zip
echo ============================================================
pause
