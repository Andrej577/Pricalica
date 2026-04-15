# Instalacija Pricalica sustava

Ovaj dokument objedinjuje informacije za instalaciju web aplikacije, API-ja i baze podataka te pokriva stavke `5.2.1` do `5.2.6`.

## 5.2 Za web aplikacije i API

Sustav se sastoji od tri glavna dijela:

- `PricalicaDB` - MySQL baza podataka i inicijalna struktura/podaci
- `PricalicaAPI` - Node.js / Express REST API
- `PricalicaWebApp/pricalicaWebApp` - Vue.js / Quasar web aplikacija

Preporuceni nacin instalacije je preko Dockera jer su u repozitoriju vec pripremljene `docker-compose.yml` datoteke.

## 5.2.1 Izrada instalacijske batch skripte

Za Windows okruzenje moze se koristiti skripta [install-pricalica.bat](install-pricalica.bat) koja:

- provjerava postoji li Docker mreza `pricalica-network`
- podize bazu podataka
- podize API
- podize web aplikaciju

Skripta se pokrece iz korijena repozitorija:

```bat
install-pricalica.bat
```

Preduvjeti:

- instaliran Docker Desktop
- omogucen Docker engine

Za potpuno pocetno postavljanje na novom racunalu moze se koristiti i skripta [bootstrap-pricalica.bat](bootstrap-pricalica.bat). Ona:

- provjerava postoji li `git`
- pokusava instalirati Git preko `winget` ako nije prisutan
- klonira projekt s GitHuba
- podize `PricalicaDB`
- podize `PricalicaAPI`
- podize `PricalicaWebApp`
- pokrece `PricalicaE2E` testove na kraju

Primjer pokretanja:

```bat
bootstrap-pricalica.bat https://github.com/REPLACE_ME/Pricalica.git C:\Deploy\Pricalica
```

Napomena: `PricalicaE2E` nije trajni servis. On se pokrece nakon sto su baza, API i web aplikacija vec aktivni, izvrsava testove i zatim se gasi.

## 5.2.2 Instalacija DB servera ako je potrebna

DB server je potreban jer API koristi MySQL bazu podataka.

U ovom projektu DB server se instalira/podize kroz Docker image `mysql:8` iz datoteke [PricalicaDB/docker-compose.yml](PricalicaDB/docker-compose.yml).

Koraci:

```bash
docker network create pricalica-network
cd PricalicaDB
docker compose up -d
```

Osnovne postavke baze:

- server: `MySQL 8`
- port: `3306`
- naziv baze: `Pricalica`
- korisnik: `user`

Napomena: ako se Docker ne koristi, potrebno je rucno instalirati MySQL Server 8.x i kreirati bazu `Pricalica`.

## 5.2.3 Instalacija DB konektora ako je potrebno

DB konektor je potreban za API aplikaciju.

Projekt koristi Node.js biblioteku `mysql2`, definiranu u [PricalicaAPI/package.json](PricalicaAPI/package.json).

Lokalna instalacija API ovisnosti:

```bash
cd PricalicaAPI
npm install
```

Ako se koristi Docker, konektor se instalira automatski tijekom build procesa API aplikacije.

API koristi sljedece varijable okruzenja za spajanje:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Te varijable cita datoteka [PricalicaAPI/Database/DB.js](PricalicaAPI/Database/DB.js).

U projektu vec postoji lokalna konfiguracija u datoteci `PricalicaAPI/.env`, a za dokumentaciju se moze navesti primjer:

```env
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USER=user
DB_PASSWORD=11
DB_NAME=Pricalica
PORT=3000
```

## 5.2.4 Instalacija pocetne baze podataka

Pocetna baza podataka je definirana u skripti [PricalicaDB/init.sql](PricalicaDB/init.sql).

Kod Docker instalacije ta se skripta izvrsava automatski pri prvom podizanju MySQL kontejnera preko mapiranja:

```yaml
./init.sql:/docker-entrypoint-initdb.d/init.sql
```

Ako se baza postavlja rucno, potrebno je:

1. kreirati praznu bazu `Pricalica`
2. pokrenuti SQL skriptu `init.sql`

Primjer:

```bash
mysql -u root -p Pricalica < init.sql
```

Time se instaliraju pocetne tablice, odnosi, triggeri i ostala pocetna struktura baze.

## 5.2.5 Instalacija softvera (API i aplikacija)

### API

API se nalazi u mapi `PricalicaAPI` i radi na portu `3000`.

Lokalno pokretanje:

```bash
cd PricalicaAPI
npm install
npm start
```

Docker pokretanje:

```bash
cd PricalicaAPI
docker compose up --build -d
```

### Web aplikacija

Web aplikacija se nalazi u mapi `PricalicaWebApp/pricalicaWebApp`.

Lokalno pokretanje:

```bash
cd PricalicaWebApp/pricalicaWebApp
npm install
npm run dev
```

Docker pokretanje:

```bash
cd PricalicaWebApp/pricalicaWebApp
docker compose up --build -d
```

Web aplikacija koristi varijablu `VITE_API_BASE_URL` za adresu API-ja. U Docker development postavi trenutno je postavljena na `http://localhost:3000`.

## 5.2.6 Postavljanje SSL (self-signed ili pravi certifikat)

U trenutnom repozitoriju nije definirana gotova SSL konfiguracija za produkcijsko okruzenje. Zato je preporuka koristiti reverse proxy, npr. `Nginx`, ispred web aplikacije i API-ja.

Moguce opcije:

- razvojno okruzenje: self-signed certifikat
- produkcija: pravi TLS/SSL certifikat, npr. Let's Encrypt

Preporucena produkcijska postava:

- `https://domena` -> web aplikacija
- `https://domena/api` -> prosljedivanje prema API servisu na portu `3000`

Za potrebe dokumentacije dovoljno je navesti:

- SSL je potrebno postaviti na razini web servera ili reverse proxy sloja
- za razvoj se moze koristiti self-signed certifikat
- za produkciju se preporucuje valjani certifikat izdan od pouzdanog CA-a

## Redoslijed instalacije

Preporuceni redoslijed implementacije i instalacije:

1. instalirati/podici Docker Desktop
2. kreirati Docker mrezu `pricalica-network`
3. podici DB server i inicijalnu bazu iz `PricalicaDB`
4. podici API iz `PricalicaAPI`
5. podici web aplikaciju iz `PricalicaWebApp/pricalicaWebApp`
6. po potrebi dodati SSL preko reverse proxy sloja

## Kratka provjera nakon instalacije

- MySQL baza dostupna na `localhost:3306`
- API dostupan na `http://localhost:3000`
- web aplikacija dostupna na `http://localhost:9000`

Ako je sve ispravno podignuto, web aplikacija bi trebala komunicirati s API-jem, a API s MySQL bazom.
