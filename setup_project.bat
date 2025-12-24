@echo off
setlocal
title KAIZEN Project Setup

echo ==========================================
echo       KAIZEN Project Setup Script
echo ==========================================

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Attempting to install via winget...
    echo Please accept any prompts that appear.
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install Node.js automatically.
        echo Please download and install it manually from: https://nodejs.org/
        echo After installing, restart this script.
        pause
        exit /b 1
    )
    
    echo.
    echo Node.js installed. You may need to restart your computer or terminal.
    echo If the script fails below, please restart and run this script again.
    echo.
    
    :: Refresh environment variables (attempt)
    call RefreshEnv.cmd >nul 2>&1
) else (
    echo Node.js is already installed.
)

:: Check for npm
call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] npm command not found. 
    echo If you just installed Node.js, please restart your terminal or computer.
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo       Setup Complete!
echo ==========================================
echo.
echo Starting development server...
call npm run dev

pause
