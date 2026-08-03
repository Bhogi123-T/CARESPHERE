@echo off
echo ========================================================
echo          CareSphere MVP Startup Script
echo ========================================================
echo.

echo Starting Backend Server (Flask)...
start "CareSphere - Backend" cmd /k "cd ehs-backend && IF EXIST venv\Scripts\activate (call venv\Scripts\activate) && python app.py"

echo Starting Frontend Server (React/Vite)...
start "CareSphere - Frontend" cmd /k "cd ehs-frontend && npm run dev"

echo.
echo ========================================================
echo Both servers have been launched in separate windows!
echo Backend will be available at: http://127.0.0.1:5000
echo Frontend will be available at: http://localhost:5174
echo.
echo You can now minimize this window.
echo ========================================================
pause
