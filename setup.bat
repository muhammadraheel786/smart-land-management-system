@echo off
REM Smart Land Management System - Quick Setup Script for Windows
REM This script helps you set up the development environment

echo.
echo Smart Land Management System - Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3 is not installed. Please install Python 3.11 or higher.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 20 or higher.
    exit /b 1
)

echo [OK] Python and Node.js are installed
echo.

REM Backend setup
echo Setting up Backend...
cd backend

if not exist ".env" (
    echo [WARNING] Creating backend\.env from .env.example
    copy .env.example .env
    echo [WARNING] Please edit backend\.env with your MongoDB Atlas connection string
    echo [WARNING] See MONGODB_ATLAS_SETUP.md for instructions
) else (
    echo [OK] backend\.env already exists
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo [OK] Backend setup complete
echo.

REM Frontend setup
cd ..\land-management
echo Setting up Frontend...

if not exist ".env.local" (
    echo [WARNING] Creating land-management\.env.local from .env.local.example
    copy .env.local.example .env.local
    echo [WARNING] Please edit land-management\.env.local if needed
) else (
    echo [OK] land-management\.env.local already exists
)

REM Install Node dependencies
echo Installing Node.js dependencies...
call npm install

echo [OK] Frontend setup complete
echo.

REM Final instructions
echo ========================================
echo Setup Complete!
echo.
echo Next steps:
echo.
echo 1. Set up MongoDB Atlas:
echo    - Follow instructions in MONGODB_ATLAS_SETUP.md
echo    - Update backend\.env with your connection string
echo.
echo 2. Start the backend:
echo    cd backend
echo    venv\Scripts\activate
echo    python manage.py runserver
echo.
echo 3. Start the frontend (in a new terminal):
echo    cd land-management
echo    npm run dev
echo.
echo 4. Open your browser:
echo    http://localhost:3000
echo.
echo 5. Login with default credentials:
echo    Email: smartland0990@admin.login.com
echo    Password: smartlandbyme@21
echo    [WARNING] CHANGE THESE IN PRODUCTION!
echo.
echo For deployment, see DEPLOYMENT_GUIDE.md
echo For security, see SECURITY.md
echo.

cd ..
pause
