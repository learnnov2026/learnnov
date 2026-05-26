@echo off
echo ===================================================
echo Pushing Render.yaml Updates to GitHub
echo ===================================================
echo.
git add render.yaml
git commit -m "Update render.yaml with Payment Gateway keys (Stripe & HyperPay)"
git push origin main
echo.
echo ===================================================
echo Done! Please check your Render Dashboard now.
echo ===================================================
pause
