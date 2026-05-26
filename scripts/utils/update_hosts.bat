@echo off
:: update_hosts.bat — شغّله بنقر مزدوج ثم اختر "تشغيل كمدير"
echo.
echo ======================================
echo  تحديث Windows hosts لـ kaif.services
echo ======================================
echo.

:: التحقق من صلاحيات المدير
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] يجب تشغيل هذا الملف كمدير.
    echo انقر بالزر الايمن على الملف واختر "تشغيل كمدير"
    pause
    exit /b 1
)

set HOSTS=C:\Windows\System32\drivers\etc\hosts

:: حذف السطور القديمة لـ learnnov.local إن وجدت
findstr /v "learnnov.local" "%HOSTS%" > "%TEMP%\hosts.tmp"
copy /y "%TEMP%\hosts.tmp" "%HOSTS%" > nul

:: إضافة kaif.services إن لم تكن موجودة
findstr /C:"kaif.services" "%HOSTS%" >nul
if %errorlevel% neq 0 (
    echo.>> "%HOSTS%"
    echo # LearnNov — kaif.services>> "%HOSTS%"
    echo 127.0.0.1  kaif.services>> "%HOSTS%"
    echo 127.0.0.1  studio.kaif.services>> "%HOSTS%"
    echo 127.0.0.1  apps.kaif.services>> "%HOSTS%"
)

echo [OK] تم تحديث hosts بنجاح!
echo.
echo الروابط التي تعمل الآن:
echo   http://kaif.services:8888
echo   http://studio.kaif.services:8888
echo   http://apps.kaif.services:8888/authn/login
echo.

:: مسح الـ DNS cache
ipconfig /flushdns > nul 2>&1
echo [OK] DNS cache تم تنظيفه
echo.
pause
