@echo off
rem One-click launcher: double-click to build ..\kb-web-upload.zip (source only, secret-checked).
rem The packing rules live in scripts\pack.sh; this just finds Git Bash and runs it.
rem Pass "nopause" as the first argument to skip the final "press any key".
setlocal
cd /d "%~dp0"

set "BASH="
for %%P in (
  "%ProgramFiles%\Git\bin\bash.exe"
  "%ProgramFiles(x86)%\Git\bin\bash.exe"
  "%LocalAppData%\Programs\Git\bin\bash.exe"
) do if not defined BASH if exist %%P set "BASH=%%~P"

rem Fall back to the Git found on PATH (...\Git\cmd\git.exe -> ...\Git\bin\bash.exe).
if not defined BASH for /f "delims=" %%G in ('where git 2^>nul') do if not defined BASH (
  if exist "%%~dpG..\bin\bash.exe" set "BASH=%%~dpG..\bin\bash.exe"
)

if not defined BASH (
  echo Git Bash was not found. Install Git for Windows: https://git-scm.com/download/win
  set "RC=1"
  goto :done
)

rem Deliberately not the bash on PATH: on Windows that is often the WSL launcher.
"%BASH%" scripts/pack.sh
set "RC=%ERRORLEVEL%"

:done
echo.
if "%RC%"=="0" (echo Done: %~dp0..\kb-web-upload.zip) else (echo FAILED - see the message above ^(exit code %RC%^).)
if /i not "%~1"=="nopause" pause
exit /b %RC%
