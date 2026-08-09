@echo off
echo ========================================================
echo          CareSphere Production Deployment Script
echo ========================================================
echo.

echo Ensure Docker Desktop is running before proceeding.
pause

echo Pulling latest base images and building containers...
docker-compose build

echo Starting CareSphere in detached mode...
docker-compose up -d

echo.
echo ========================================================
echo CareSphere has been successfully deployed using Docker!
echo You can view the status of your containers using: docker-compose ps
echo To view logs, use: docker-compose logs -f
echo ========================================================
pause
