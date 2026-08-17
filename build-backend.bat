@echo off
REM Build script for PyInstaller backend compilation
REM Run this before npm run desktop:build

echo Installing PyInstaller...
pip install -q pyinstaller

echo.
echo Building backend executable...
cd backend
pyinstaller desktop_server.spec --distpath dist

echo.
echo Backend build complete! The executable is at: backend\dist\backend-server\backend-server.exe
