@echo off
echo [LearnNov Cloud] Starting Git initialization...

git init
git add .
git commit -m "Initial commit: Standalone Cloud Version"

echo.
echo ======================================================
echo 1. Create a NEW PRIVATE REPOSITORY on GitHub named "learnnov-cloud"
echo 2. Run the following command (replace YOUR_URL with the repo link):
echo    git remote add origin YOUR_URL
echo 3. Push the code:
echo    git push -u origin master
echo ======================================================
pause
