@echo off
setlocal
title KAIZEN - Fix & Run

echo ========================================================
echo   KAIZEN: Auto-Fixer & Launcher
echo ========================================================
echo.

:: 1. Check if Node is in PATH
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is found in PATH.
    goto :install_deps
)

:: 2. Check common installation paths
if exist "C:\Program Files\nodejs\node.exe" (
    echo [OK] Node.js found in Program Files.
    set "PATH=%PATH%;C:\Program Files\nodejs"
    goto :install_deps
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo [OK] Node.js found in Program Files (x86).
    set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    goto :install_deps
)

:: 3. If not found, try to install via Winget
echo [!] Node.js is NOT installed or not found.
echo.
echo Attempting to install Node.js automatically...
echo Please click "Yes" if asked for permission.
echo.

winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Automatic installation failed.
    echo.
    echo Please download Node.js manually:
    echo https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi
    echo.
    echo After installing, RESTART YOUR COMPUTER and run this script again.
    pause
    exit /b 1
)

echo.
echo [OK] Node.js installed successfully!
echo You might need to restart this script for the changes to take effect.
echo.
pause
exit /b 0

:install_deps
echo.
echo [STEP 1] Installing project dependencies...
echo (This fixes the 'client.ts' errors)
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [STEP 2] Starting the server...
call npm run dev

pause
