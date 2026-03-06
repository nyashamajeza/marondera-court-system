@echo off
echo ========================================
echo   Marondera Court System - Development
echo ========================================
echo.

:: Check if MongoDB is running
echo Checking MongoDB status...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB is not running
    echo Starting MongoDB...
    start /B mongod --dbpath C:\data\db
    timeout /t 5
)

:: Start the application
echo.
echo Starting Node.js application...
echo.
echo Server will be available at: http://localhost:3000
echo.
npm run dev

pause