@echo off
title LearnNov Cloud Setup & Development Server
color 0B
echo =====================================================================
echo                 LearnNov Cloud - Standalone Backend Setup
echo =====================================================================
echo.

echo [+] Step 1: Generating Django migrations for all custom applications...
python manage.py makemigrations academic_programs university_ads learnnov_exams learnnov_certificates learnnov_payments program_ads
if %errorlevel% neq 0 (
    color 0C
    echo [x] Error generating migrations! Please ensure python is installed and you are in the correct directory.
    pause
    exit /b %errorlevel%
)
echo.

echo [+] Step 2: Applying migrations to the database...
python manage.py migrate
if %errorlevel% neq 0 (
    color 0C
    echo [x] Error applying migrations!
    pause
    exit /b %errorlevel%
)
echo.
color 0A
echo [✓] Migrations generated and applied successfully!
echo =====================================================================
echo.

color 0B
set /p create_user="[?] Do you want to create an Admin Superuser now? (y/n): "
if /i "%create_user%"=="y" (
    echo.
    echo [+] Starting Superuser creation...
    python manage.py createsuperuser
)
echo.

set /p start_server="[?] Do you want to start the local development server now? (y/n): "
if /i "%start_server%"=="y" (
    echo.
    echo [+] Starting Django server at http://127.0.0.1:8000/
    echo [*] Press Ctrl+C in this window to stop the server.
    echo.
    python manage.py runserver
) else (
    echo.
    echo [+] Setup complete! You can double-click this file anytime to manage setup.
    pause
)
