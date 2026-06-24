@echo off
echo ========================================================
echo Starting AAR GLOBE Backend Server...
echo ========================================================
echo.

:: Add portable Node.js to the path for this terminal window
set PATH=%~dp0project\node-env\node-v20.11.0-win-x64;%PATH%

:: Navigate to backend and run dev server
cd "%~dp0project\backend"

:: Open the customer website automatically after the server has a moment to start
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:5000'"

npm run dev

pause
