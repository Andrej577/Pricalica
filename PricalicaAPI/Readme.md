# Pricalica API

Backend REST API aplikaciju za upravljanje korisnicima, knjigama, transakcijama i interakcijama.

Aplikacija je napravljena u **Node.js** upotrebom **Express** frameworka, a komunikacija s bazom je napravljena kroz vlastite module.
Svi API endpointi vraćaju podatke u **JSON** formatu.

---

## Kako pokrenuti projekt

### Lokalno

1. Kloniraj repozitorij:

   ```bash
   git clone https://github.com/Andrej577/PricalicaAPI.git
   cd pricalica-api
   ```

2. Instaliraj potrebne pakete:

   ```bash
   npm install
   ```

3. Pokreni aplikaciju:
   ```bash
   npm start
   ```

Aplikacija će raditi na:
`http://localhost:3000`

### Putem Dockera

1. Pokreni aplikaciju koristeći **Dockerfile**:

   ```bash
   docker build -t pricalica-api .
   docker run -p 3000:3000 pricalica-api
   ```

2. Ili koristi **Docker Compose**:
   ```bash
   docker-compose up --build
   ```

---

## Struktura projekta

```
/Database/DB.js            -> Povezivanje na MySQL bazu
/Routes/korisnici.js       -> Rute za korisnike
/Routes/knjige.js          -> Rute za knjige
/Routes/transakcije.js     -> Rute za transakcije
/Routes/interakcije.js     -> Rute za recenzije, ocjene
/Routes/analitika.js       -> Rute za analitiku slusanja
/Routes/povijestSlusanja.js -> Povijest slusanja knjiga
/Routes/zanrovi.js         -> Rute za žanrove
/Routes/login.js           -> Login i autentifikacija
index.js                   -> Glavna aplikacija
Dockerfile                 -> Definicija Docker image-a
docker-compose.yml         -> Konfiguracija za Docker Compose
```

---

## Dostupne rute

Sve rute koriste **HTTP metode** i vraćaju **JSON** odgovor.

| Endpoint                 | Opis                              |
| ------------------------ | --------------------------------- |
| `GET /`                  | Pozdravna poruka                  |
| `GET /korisnici`         | Dohvat svih korisnika             |
| `GET /knjige`            | Dohvat svih knjiga                |
| `GET /transakcije`       | Dohvat svih transakcija           |
| `GET /interakcije`       | Dohvat svih interakcija/recenzija |
| `GET /analitika`         | Dohvat analitike slusanja         |
| `GET /zanrovi`           | Dohvat žanrova                    |
| `GET /povijest_slusanja` | Dohvat povijesti slusanja         |
| `POST /login`            | Prijava korisnika                 |

_(mogu postojati i dodatne metode po ruti – ovisi o implementaciji)_

---

## Posebne napomene

- Projekt koristi **modularni nacin pokretanja** aplikacije:
  - Kada je `index.js` pokrenut **direktno**, podize server (`app.listen`).
  - Kada je **importiran** (npr. u **testove** sa Jest-om), **ne podize server** – što omogućava jednostavno testiranje bez otvaranja dodatnih "handleova".

- **Sve rute** ocekuju i vracaju **JSON**.

---

## Testiranje

Za potrebe **testiranja** (npr. preko **Jest** frameworka), aplikacija je modularizirana.
Zato se server (`listen`) pokrece samo ako se `index.js` direktno izvrsava.

---

## Tehnologije

- Node.js
- Express.js
- MySQL (baza podataka)
- Jest (za testiranje)
- Dotenv (ako se koristi `.env` za konfiguraciju)
- Docker & Docker Compose (za lakse pokretanje)

---

## TODO (moguće buduće nadogradnje)

- Dodati autentifikaciju putem JWT tokena
- Uvesti paginaciju za dohvat velikih lista (npr. knjiga, korisnika)
- Napraviti validaciju inputa na API razini
- Uvesti rolnu kontrolu pristupa (admin/korisnik/autor)

---
