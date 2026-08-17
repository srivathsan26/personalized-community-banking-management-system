@echo off
REM Gramin Connect Hub - Complete Build Script
REM This script builds the entire desktop app in one go

cd /d "%~dp0"

echo.
echo ========================================================================
echo  GRAMIN CONNECT HUB - DESKTOP APP BUILD
echo ========================================================================
echo.

echo Step 1 of 4: Building React Frontend...
echo.
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo Step 2 of 4: Building Python Backend...
echo.
call npm run backend:build
if errorlevel 1 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)

echo.
echo Step 3 of 4: Creating Windows Installer...
echo.
call npm run desktop:build
if errorlevel 1 (
    echo ERROR: Installer creation failed
    pause
    exit /b 1
)

echo.
echo Step 4 of 4: Creating Distribution ZIP...
echo.
call npm run package:zip
if errorlevel 1 (
    echo ERROR: ZIP creation failed
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo  BUILD COMPLETE!
echo ========================================================================
echo.
echo Your files are ready:
echo.
echo Installer:
echo   release\Gramin Connect Hub-Setup-0.0.0.exe
echo.
echo Distribution ZIP:
echo   dist-package\Gramin-Connect-Hub-Setup.zip
echo.
echo You can now:
echo  1. Test the .exe on this machine
echo  2. Share the .zip file with others
echo.
echo ========================================================================
echo.
pause
