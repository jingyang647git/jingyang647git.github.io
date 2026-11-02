@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  Hexo build + deploy  (GitHub -> Vercel)
echo  Target: https://www.sovely.cn
echo ============================================
echo.
echo  TIP: do NOT click or select text in this window
echo       while it runs. Windows console QuickEdit will
echo       PAUSE the process and it looks frozen.
echo.

echo [0/3] cleanup leftover hexo processes...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\kill-stray-hexo.ps1"
echo.

echo [1/3] clean...
call npx hexo clean
if errorlevel 1 goto fail

echo [2/3] generate...
call npx hexo generate
if errorlevel 1 goto fail
if not exist "public\index.html" goto fail

echo [3/3] deploy to GitHub...
call npx hexo deploy
if not errorlevel 1 goto deploy_ok

echo.
echo   direct push failed, retrying through proxy 127.0.0.1:7897 ...
git --git-dir="%~dp0.deploy_git\.git" config http.proxy http://127.0.0.1:7897
call npx hexo deploy
if errorlevel 1 goto deploy_fail

:deploy_ok
git --git-dir="%~dp0.deploy_git\.git" config --unset http.proxy >nul 2>&1
echo.
echo Done. Vercel will be live in about 20 seconds.
echo Open: https://www.sovely.cn
echo.
pause
exit /b 0

:deploy_fail
git --git-dir="%~dp0.deploy_git\.git" config --unset http.proxy >nul 2>&1
echo.
echo DEPLOY FAILED. Your build is fine (step 2 passed), only the
echo GitHub push was blocked. Check that your proxy software is
echo running, then run publish.bat again - it will retry.
echo.
pause
exit /b 1

:fail
echo.
echo FAILED - check the log above.
echo.
echo  If nothing printed after "[2/3] generate...", either
echo  the window was paused by a click/selection, or a
echo  previous run was still alive holding the files.
echo  Close this window and run publish.bat again - the
echo  script now cleans up leftover processes by itself.
echo.
pause
exit /b 1
