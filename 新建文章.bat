@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   新建博客文章
echo ============================================
echo.

set "TITLE="
set /p TITLE=请输入文章标题（直接回车确认）: 

if "%TITLE%"=="" (
  echo [错误] 标题不能为空
  pause
  exit /b 1
)

echo.
echo 正在创建: %TITLE%
call npx hexo new "%TITLE%"
if errorlevel 1 (
  echo [错误] 创建失败，请查看上面的日志
  pause
  exit /b 1
)

echo.
echo 已创建: source\_posts\%TITLE%.md
echo 正在用默认编辑器打开...
start "" "source\_posts\%TITLE%.md"

timeout /t 2 >nul
exit /b 0
