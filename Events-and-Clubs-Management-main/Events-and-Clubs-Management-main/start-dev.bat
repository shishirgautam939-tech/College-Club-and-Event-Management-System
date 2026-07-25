@echo off
rem Starts everything needed to run the Evento app on a phone:
rem  - Django backend on 0.0.0.0:8000 (reachable from the phone over Wi-Fi)
rem  - Expo dev server for the mobile app (scan the QR with Expo Go)
rem If your PC's Wi-Fi IP changes, update mobile\.env and rerun this.
start "Django backend" cmd /k "cd /d %~dp0backend && env\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
start "Expo (mobile app)" cmd /k "cd /d %~dp0mobile && npx expo start -c"
