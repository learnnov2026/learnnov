@echo off
title LearnNov Platform - Unified Setup & Runner
color 0B
cls

echo =========================================================================
echo  🎓  LearnNov Academic Platform - Unified Local Setup & Runner
echo =========================================================================
echo.
echo  This script will automatically:
echo  1. Verify and configure Python Virtual Environment (venv)
echo  2. Install all requirements (Django, Stripe, pymongo, etc.)
echo  3. Create migrations and migrate the database
echo  4. Seed the database with mock courses, specializations, and subscription plans
echo  5. Verify Next.js dependencies
echo  6. Concurrently launch both Backend (8000) & Frontend (3000)
echo.
echo =========================================================================
echo.

:: ── Step 1: Verify Python Environment ──
echo [+] Checking Python environment for backend...
if not exist "learnnov-cloud\venv" (
    echo [!] Virtual environment not found in learnnov-cloud\venv. Creating now...
    python -m venv learnnov-cloud\venv
    if %errorlevel% neq 0 (
        color 0C
        echo [x] Error: Failed to create python virtual environment! Make sure Python is installed.
        pause
        exit /b 1
    )
)
echo [✓] Python Virtual Environment verified.
echo.

:: ── Step 2: Install Backend Dependencies ──
echo [+] Installing/Updating Python dependencies inside virtualenv...
learnnov-cloud\venv\Scripts\python.exe -m pip install --upgrade pip
learnnov-cloud\venv\Scripts\pip.exe install -r learnnov-cloud\requirements.txt
if %errorlevel% neq 0 (
    color 0C
    echo [x] Error: Failed to install Python dependencies!
    pause
    exit /b 1
)
echo [✓] Python dependencies verified.
echo.

:: ── Step 3: Run Django Database Migrations ──
echo [+] Generating and applying database migrations...
learnnov-cloud\venv\Scripts\python.exe learnnov-cloud\manage.py makemigrations academic_programs university_ads learnnov_exams learnnov_certificates learnnov_payments program_ads
learnnov-cloud\venv\Scripts\python.exe learnnov-cloud\manage.py migrate
if %errorlevel% neq 0 (
    color 0C
    echo [x] Error: Failed to complete database migrations!
    pause
    exit /b 1
)
echo [✓] Database migrated successfully.
echo.

:: ── Step 4: Seed Database ──
echo [+] Seeding database with mock courses, specializations, plans, and exams...
learnnov-cloud\venv\Scripts\python.exe learnnov-cloud\manage.py seed_data
if %errorlevel% neq 0 (
    color 0C
    echo [x] Warning: Seeding encountered a minor issue.
)
echo.

:: ── Step 5: Ask to run Unit Tests ──
set /p run_tests="[?] Do you want to run the Django 25-Test Suite first to verify integrity? (y/n): "
if /i "%run_tests%"=="y" (
    echo.
    echo [+] Running backend test suite...
    learnnov-cloud\venv\Scripts\python.exe learnnov-cloud\manage.py test
    if %errorlevel% neq 0 (
        color 0C
        echo [x] Warning: Some tests failed. Please inspect logs.
        set /p proceed="[?] Proceed to start servers anyway? (y/n): "
        if /i "%proceed%" neq "y" exit /b 1
    ) else (
        color 0A
        echo [✓] All backend tests passed successfully!
        color 0B
    )
)
echo.

:: ── Step 6: Verify Next.js Dependencies ──
echo [+] Verifying React/Next.js frontend dependencies...
if not exist "learnnov-web\node_modules" (
    echo [!] node_modules not found in learnnov-web. Installing dependencies...
    cd learnnov-web
    call npm install
    cd ..
) else (
    echo [✓] Next.js dependencies verified.
)
echo.

:: ── Step 7: Launch Dev Servers ──
echo =========================================================================
echo [+] Launching LearnNov Platform Servers...
echo [*] Django Backend will run in a separate window on http://127.0.0.1:8000/
echo [*] Next.js Frontend will run in a separate window on http://localhost:3000/
echo =========================================================================
echo.

:: Launch Django
start "LearnNov Backend Server" cmd /k "cd learnnov-cloud && venv\Scripts\python.exe manage.py runserver"

:: Launch Next.js
start "LearnNov Frontend Server" cmd /k "cd learnnov-web && npm run dev"

echo [✓] Both servers initiated! Check the newly opened windows for logs.
echo [*] Press any key to exit this installer screen.
pause > nul
exit
