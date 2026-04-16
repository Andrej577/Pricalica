@echo off
setlocal EnableExtensions

REM ============================================================
REM Pricalica bootstrap skripta
REM 1. Po potrebi instalira Git preko winget-a
REM 2. Klonira GitHub repozitorij
REM 3. Kreira Docker mrezu
REM 4. Podize DB -> API -> Music -> Web
REM 5. Pokrece E2E testove
REM
REM Primjer:
REM   bootstrap-pricalica.bat https://github.com/korisnik/Pricalica.git C:\Deploy\Pricalica
REM
REM Ako argumenti nisu zadani, koriste se vrijednosti ispod.
REM ============================================================

set "REPO_URL=%~1"
if "%REPO_URL%"=="" set "REPO_URL=https://github.com/REPLACE_ME/Pricalica.git"

set "TARGET_DIR=%~2"
if "%TARGET_DIR%"=="" set "TARGET_DIR=%CD%\Pricalica"

set "NETWORK_NAME=pricalica-network"

echo === Pricalica bootstrap ===
echo Repo:   %REPO_URL%
echo Folder: %TARGET_DIR%
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git nije pronadjen. Pokusavam instalaciju preko winget...
  where winget >nul 2>nul
  if errorlevel 1 (
    echo Winget nije dostupan. Instaliraj Git rucno pa ponovno pokreni skriptu.
    exit /b 1
  )

  winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
  if errorlevel 1 (
    echo Git instalacija nije uspjela.
    exit /b 1
  )

  echo Git je instaliran. Ako naredba git jos nije dostupna u ovom prozoru, zatvori ga i pokreni skriptu ponovno.
  where git >nul 2>nul
  if errorlevel 1 exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker nije pronadjen. Potrebno je instalirati Docker Desktop prije nastavka.
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo Docker engine trenutno nije dostupan. Pokreni Docker Desktop pa ponovno pokreni skriptu.
  exit /b 1
)

if exist "%TARGET_DIR%\.git" (
  echo Repozitorij vec postoji. Dohvacam zadnje promjene...
  pushd "%TARGET_DIR%"
  git pull
  if errorlevel 1 (
    echo Git pull nije uspio.
    popd
    exit /b 1
  )
  popd
) else (
  echo Kloniram repozitorij...
  git clone "%REPO_URL%" "%TARGET_DIR%"
  if errorlevel 1 (
    echo Git clone nije uspio. Provjeri REPO_URL.
    exit /b 1
  )
)

docker network inspect %NETWORK_NAME% >nul 2>nul
if errorlevel 1 (
  echo Kreiram Docker mrezu %NETWORK_NAME%...
  docker network create %NETWORK_NAME%
  if errorlevel 1 (
    echo Ne mogu kreirati Docker mrezu.
    exit /b 1
  )
) else (
  echo Docker mreza %NETWORK_NAME% vec postoji.
)

echo.
echo [1/4] Podizem PricalicaDB...
pushd "%TARGET_DIR%\PricalicaDB"
docker compose up -d
if errorlevel 1 (
  echo Neuspjelo podizanje PricalicaDB.
  popd
  exit /b 1
)
popd

echo Cekam 15 sekundi da se MySQL inicijalizira...
timeout /t 15 /nobreak >nul

echo.
echo [2/4] Podizem PricalicaAPI...
pushd "%TARGET_DIR%\PricalicaAPI"
docker compose up --build -d
if errorlevel 1 (
  echo Neuspjelo podizanje PricalicaAPI.
  popd
  exit /b 1
)
popd

echo Cekam 10 sekundi da se API podigne...
timeout /t 10 /nobreak >nul

echo.
echo.
echo [3/5] Podizem Pricalica-music-service...
pushd "%TARGET_DIR%\Pricalica-music-service"
docker compose up --build -d
if errorlevel 1 (
  echo Neuspjelo podizanje Pricalica-music-service.
  popd
  exit /b 1
)
popd

echo Cekam 10 sekundi da se music service podigne...
timeout /t 10 /nobreak >nul

echo.
echo [4/5] Podizem PricalicaWebApp...
pushd "%TARGET_DIR%\PricalicaWebApp\pricalicaWebApp"
docker compose up --build -d
if errorlevel 1 (
  echo Neuspjelo podizanje PricalicaWebApp.
  popd
  exit /b 1
)
popd

echo Cekam 20 sekundi da se web aplikacija podigne...
timeout /t 20 /nobreak >nul

echo.
echo [5/5] Pokrecem PricalicaE2E testove...
pushd "%TARGET_DIR%\PricalicaE2E"
docker compose up --build --abort-on-container-exit playwright
set "E2E_EXIT=%ERRORLEVEL%"
popd

echo.
echo === Status servisa ===
echo DB:  MySQL na localhost:3306
echo API: http://localhost:3000
echo MUSIC: http://localhost:5000
echo WEB: http://localhost:9000

if not "%E2E_EXIT%"=="0" (
  echo.
  echo E2E testovi su zavrsili s greskom. Servisi mogu i dalje ostati podignuti.
  exit /b %E2E_EXIT%
)

echo.
echo E2E testovi su uspjesno zavrseni.
exit /b 0
