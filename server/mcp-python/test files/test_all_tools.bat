@echo off
REM Test all 71 MCP tools via the REST API
REM Usage:
REM   Local:  test_all_tools.bat
REM   Prod:   test_all_tools.bat https://mcp-tools-npa.apps.your-cluster.com
REM   Custom: test_all_tools.bat http://10.0.1.50:3002

if "%~1"=="" (
    set "BASE_URL=http://localhost:3002"
) else (
    set "BASE_URL=%~1"
)

echo.
echo   Target: %BASE_URL%
echo.

python "%~dp0test_runner.py" %BASE_URL%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   Some tests FAILED. Check output above.
    pause
    exit /b 1
)

echo.
pause
