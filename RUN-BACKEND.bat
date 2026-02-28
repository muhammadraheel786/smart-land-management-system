@echo off
REM Start Django backend on 127.0.0.1:8000 (no redirects; APIs return JSON only).
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python manage.py runserver 127.0.0.1:8000
