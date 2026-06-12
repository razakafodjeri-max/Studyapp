@echo off
title StudyFlow - Demarrage Rapide
echo ==========================================================
echo           STUDYFLOW - ASSISTANT DE CONCENTRATION
echo ==========================================================
echo.

:: Se placer dans le dossier actuel du script
cd /d "%~dp0"

:: Verification de la presence de node_modules
if not exist "node_modules\" (
    echo [1/2] Dependances manquantes. Installation en cours...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERREUR] L'installation des dependances a echoue.
        echo Assurez-vous que Node.js est bien installe sur votre PC.
        pause
        exit /b %errorlevel%
    )
    echo.
    echo [OK] Dependances installees avec succes.
) else (
    echo [1/2] Dependances deja presentes.
)

echo.
echo [2/2] Lancement de l'application StudyFlow IA...
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [INFO] L'application s'est fermee avec un code d'erreur ou a ete interrompue.
    pause
)
