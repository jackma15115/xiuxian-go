@echo off
echo [1/2] Building frontend assets with Webpack...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Webpack build failed!
    exit /b %errorlevel%
)

echo [2/2] Compiling Go Web application with embedded assets...
go build -ldflags="-s -w" -o xiuxian.exe .
if %errorlevel% neq 0 (
    echo [ERROR] Go build failed!
    exit /b %errorlevel%
)

echo.
echo ====================================================
echo  Build Success! Generated standalone: xiuxian.exe
echo  Start with: xiuxian.exe
echo ====================================================
