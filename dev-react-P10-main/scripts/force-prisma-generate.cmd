@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0\.."

echo.
echo === 1) Arrêt des processus node.exe (libère query_engine sous Windows) ===
echo    (Fermez aussi les onglets dev dans le navigateur si besoin.)
taskkill /F /IM node.exe /T 2>nul
if errorlevel 1 (
  echo    Aucun node.exe trouvé ou déjà arrêté.
) else (
  echo    Processus Node arrêtés.
)
timeout /t 3 /nobreak >nul

echo.
echo === 2) Suppression node_modules\.prisma ===
if exist "node_modules\.prisma" (
  rd /s /q "node_modules\.prisma"
  echo    OK.
) else (
  echo    Déjà absent.
)

echo.
echo === 3) prisma generate ===
call npx prisma generate
set EXIT=%ERRORLEVEL%

echo.
if %EXIT% NEQ 0 (
  echo ECHEC code %EXIT%. Essayez : redémarrer le PC, ou exécuter cette invite en administrateur.
) else (
  echo Terminé avec succès.
)
pause
exit /b %EXIT%
