@echo off
setlocal

echo === Pricalica instalacija / pokretanje ===

docker network inspect pricalica-network >nul 2>nul
if errorlevel 1 (
  echo Kreiram Docker mrezu pricalica-network...
  docker network create pricalica-network
) else (
  echo Docker mreza pricalica-network vec postoji.
)

echo.
echo Pokrecem bazu podataka...
pushd PricalicaDB
docker compose up -d
popd

echo.
echo Pokrecem API...
pushd PricalicaAPI
docker compose up --build -d
popd

echo.
echo Pokrecem web aplikaciju...
pushd PricalicaWebApp\pricalicaWebApp
docker compose up --build -d
popd

echo.
echo Instalacija / pokretanje zavrseno.
echo DB:  MySQL na localhost:3306
echo API: http://localhost:3000
echo WEB: http://localhost:9000

endlocal
