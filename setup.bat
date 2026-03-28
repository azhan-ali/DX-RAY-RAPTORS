@echo off
REM DevPulse Setup Script for Windows
REM One-command setup for the entire project

echo ======================================
echo       DevPulse - Setup Script
echo     Repository Health X-Ray
echo ======================================
echo.

REM Check prerequisites
echo [1/4] Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo X Node.js not found. Install from https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo   OK Node.js %%i

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo X Python not found. Install from https://python.org
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do echo   OK %%i

where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo X Git not found. Install from https://git-scm.com
    exit /b 1
)
for /f "tokens=3" %%i in ('git --version') do echo   OK Git %%i

echo.

REM Install Python dependencies
echo [2/4] Installing Python dependencies...
cd analyzers
python -m pip install -r requirements.txt --quiet 2>nul
if %ERRORLEVEL% neq 0 (
    echo   Warning: Some Python packages failed. Template fallbacks will be used.
)
cd ..
echo   OK Python dependencies ready
echo.

REM Install Node.js dependencies
echo [3/4] Installing Node.js dependencies...
cd devpulse
call npm install --silent 2>nul
echo   OK Node.js dependencies ready
echo.

REM Done
echo ======================================
echo [4/4] Setup Complete!
echo ======================================
echo.
echo   To start:
echo     cd devpulse
echo     npm run dev
echo.
echo   Then open http://localhost:3000
echo ======================================
