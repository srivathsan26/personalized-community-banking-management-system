@echo off
REM Create distribution package with installer
REM This script builds the app and packages it into a distributable zip

setlocal enabledelayedexpansion

echo.
echo ===================================
echo Gramin Connect Hub - Build & Package
echo ===================================
echo.

REM Step 1: Install dependencies if needed
echo [1/5] Checking dependencies...
if not exist node_modules (
    echo Installing Node dependencies...
    call npm install -q
)

REM Step 2: Build frontend
echo [2/5] Building React frontend...
call npm run build
if !errorlevel! neq 0 (
    echo ERROR: Frontend build failed
    exit /b 1
)

REM Step 3: Build backend exe
echo [3/5] Building Python backend executable...
call npm run backend:build
if !errorlevel! neq 0 (
    echo ERROR: Backend build failed
    exit /b 1
)

REM Step 4: Create installer
echo [4/5] Creating Windows installer...
call npx electron-builder --win nsis
if !errorlevel! neq 0 (
    echo ERROR: Installer creation failed
    exit /b 1
)

REM Step 5: Package into zip
echo [5/5] Creating distribution zip...

if not exist dist-package (
    mkdir dist-package
)

REM Clear old zip
if exist dist-package\Gramin-Connect-Hub-Setup.zip (
    del dist-package\Gramin-Connect-Hub-Setup.zip
)

REM Create zip with installer
cd release
if exist "Gramin Connect Hub-Setup-0.0.0.exe" (
    powershell -Command "Compress-Archive -Path 'Gramin Connect Hub-Setup-0.0.0.exe' -DestinationPath '..\dist-package\Gramin-Connect-Hub-Setup.zip' -Force"
    cd ..
    
    echo.
    echo ===================================
    echo ✅ SUCCESS!
    echo ===================================
    echo.
    echo Installer Location:
    echo   release\Gramin Connect Hub-Setup-0.0.0.exe
    echo.
    echo Distribution Package:
    echo   dist-package\Gramin-Connect-Hub-Setup.zip
    echo.
    echo Ready to share! You can now:
    echo   - Share the .zip file anywhere
    echo   - Extract on target machine
    echo   - Run the .exe installer
    echo.
) else (
    cd ..
    echo ERROR: Installer not found at release\Gramin Connect Hub-Setup-0.0.0.exe
    exit /b 1
)

endlocal
