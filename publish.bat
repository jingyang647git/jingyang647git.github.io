@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  Hexo build + deploy  (GitHub -> Vercel)
echo  Target: https://www.sovely.cn
echo ============================================
echo.

echo [1/3] clean...
call npx hexo clean
if errorlevel 1 goto fail

echo [2/3] generate...
call npx hexo generate
if errorlevel 1 goto fail

echo [3/3] deploy to GitHub...
call npx hexo deploy
if errorlevel 1 goto fail

echo.
echo Done. Vercel will be live in about 20 seconds.
echo Open: https://www.sovely.cn
echo.
pause
exit /b 0

:fail
echo.
echo FAILED - check the log above.
pause
exit /b 1
