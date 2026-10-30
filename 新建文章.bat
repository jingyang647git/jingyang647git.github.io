@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   New blog post
echo ============================================
echo.

set "TITLE="
set /p "TITLE=Post title (Chinese OK), Enter to confirm: "
if not defined TITLE goto empty

echo.
echo Creating: %TITLE%
call npx hexo new "%TITLE%"
if errorlevel 1 goto fail

if not exist "source\_posts\%TITLE%.md" goto fail

echo Opening: source\_posts\%TITLE%.md
start "" "source\_posts\%TITLE%.md"
ping -n 3 127.0.0.1 >nul
exit /b 0

:empty
echo [ERROR] Title is empty.
pause
exit /b 1

:fail
echo [ERROR] Failed. Check the log above.
pause
exit /b 1
