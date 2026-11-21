@echo off
REM =====================================================================
REM  NIPCO - build the install package on a Windows machine.
REM  Double-click this file, or run it from a command prompt.
REM  It installs the required tools (Node.js, .NET SDK 10) if they are
REM  missing, then builds the whole package into  .\publish\
REM =====================================================================
setlocal
cd /d "%~dp0"

echo.
echo ==========================================================
echo   NIPCO - building the install package
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\build-package.ps1" -OutputPath "%~dp0publish" %*
set EXITCODE=%ERRORLEVEL%

echo.
if not "%EXITCODE%"=="0" (
  echo BUILD FAILED - see the messages above.
) else (
  echo Package ready:  %~dp0publish
  echo Copy that folder to the server and follow docs\install-guide.md
)
echo.
pause
exit /b %EXITCODE%
