@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          🚀 LearnNov Backend - Render Deployment            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Follow these steps to deploy the backend on Render.com:
echo.
echo ──────────────────────────────────────────────────────────────
echo  STEP 1: Open Render Dashboard
echo ──────────────────────────────────────────────────────────────
echo.
echo   https://dashboard.render.com
echo.
echo ──────────────────────────────────────────────────────────────
echo  STEP 2: Create New Blueprint Instance
echo ──────────────────────────────────────────────────────────────
echo.
echo   1. Click "New" then "Blueprint"
echo   2. Connect your GitHub account if not connected
echo   3. Select repository: learnnov2026/learnnov
echo   4. Set Blueprint Path to: learnnov-cloud/render.yaml
echo   5. Click "Apply"
echo.
echo ──────────────────────────────────────────────────────────────
echo  STEP 3: Set Environment Variables (Optional - for payments)
echo ──────────────────────────────────────────────────────────────
echo.
echo   After deployment, go to the service settings and add:
echo   - STRIPE_SECRET_KEY
echo   - STRIPE_PUBLISHABLE_KEY
echo   - STRIPE_WEBHOOK_SECRET
echo   - HYPERPAY_ACCESS_TOKEN (if needed)
echo.
echo ──────────────────────────────────────────────────────────────
echo  EXPECTED RESULTS:
echo ──────────────────────────────────────────────────────────────
echo.
echo   Backend API:  https://learnnov-api.onrender.com
echo   Admin Panel:  https://learnnov-api.onrender.com/admin/
echo   Health Check: https://learnnov-api.onrender.com/health/
echo.
echo   Admin Login:
echo     Username: admin
echo     Password: Admin@LearnNov2026!
echo.
echo ══════════════════════════════════════════════════════════════
echo.

start https://dashboard.render.com/select-repo?type=blueprint

echo Opening Render Dashboard in your browser...
echo.
pause
