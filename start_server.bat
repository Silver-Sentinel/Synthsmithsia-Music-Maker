@echo off
title Synthsmithsia Server Launcher
color 0A
cls

echo ===================================================
echo      SYNTHSMITHSIA MUSIC MAKER - LAUNCHER
echo ===================================================
echo.
echo Modern web audio apps require a local web server 
echo to load audio modules correctly.
echo.

:: Check for Node.js / npx
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js found. Starting server...
    echo.
    echo Opening browser...
    echo Press Ctrl+C to stop the server.
    echo.
    call npx -y http-server -o -c-1
    goto :EOF
)

:: Check for Python
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python found. Starting server...
    echo.
    echo Opening browser...
    start http://localhost:8000
    python -m http.server 8000
    goto :EOF
)

:: Fallback
color 0C
echo [ERROR] Neither Node.js nor Python was found.
echo.
echo To run this application, you need to install Node.js:
echo https://nodejs.org/
echo.
pause
