@echo off
echo Starting LearnNov Platform...
start "LearnNov Backend Server" cmd /k "cd %~dp0learnnov-cloud && venv\Scripts\python.exe manage.py runserver"
start "LearnNov Frontend Server" cmd /k "cd %~dp0learnnov-web && npm run dev"
echo Both servers launched in separate windows!
