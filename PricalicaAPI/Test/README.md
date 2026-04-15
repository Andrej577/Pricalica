# Primjer Testiranja API-ja

U projektu je za testiranje API-ja korišten:

- `Jest` za pisanje i pokretanje testova
- `Supertest` za slanje HTTP zahtjeva prema Express aplikaciji
- stvarna MySQL baza podataka za provjeru rezultata

Testovi se pokreću naredbom:

```bash
npm test
```

U nastavku je prikazan jedan konkretan primjer testiranja rute za prijavu korisnika.

## Primjer: testiranje `POST /login`

```js
const request = require('supertest');
const app = require('../index.js');
const { pool } = require('../Database/DB');

describe('Ruta /login', () => {
    test('POST /login vraca korisnika za ispravne podatke', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                email: 'ivana.radic@example.com',
                lozinka: 'Ivana#Best9',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Prijava uspjesna');
        expect(res.body).toHaveProperty('korisnik_id');
    });

    test('POST /login vraca 401 za neispravne podatke', async () => {
        const res = await request(app)
            .post('/login')
            .send({
                email: 'krivi@example.com',
                lozinka: 'krivo',
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
});
```

## Objašnjenje koda

### Uvoz biblioteka

```js
const request = require('supertest');
const app = require('../index.js');
```

Ovdje se:

- učitava `supertest`
- učitava Express aplikacija iz `index.js`

To omogućuje da se test šalje direktno na backend bez ručnog otvaranja browsera ili Postmana.

### Grupiranje testova

```js
describe('Ruta /login', () => {
```

`describe` služi za grupiranje testova koji pripadaju istoj ruti ili istoj funkcionalnosti.

### Test uspješne prijave

```js
const res = await request(app)
    .post('/login')
    .send({
        email: 'ivana.radic@example.com',
        lozinka: 'Ivana#Best9',
    });
```

Ovaj dio:

- šalje `POST` zahtjev na `/login`
- šalje podatke korisnika u body zahtjeva

Backend zatim provjerava postoji li korisnik s tim podacima u bazi.

Provjera rezultata:

```js
expect(res.statusCode).toBe(200);
expect(res.body).toHaveProperty('message', 'Prijava uspjesna');
expect(res.body).toHaveProperty('korisnik_id');
```

Ovdje se provjerava:

- je li status odgovora `200`
- je li backend vratio poruku o uspješnoj prijavi
- je li vraćen `korisnik_id`

### Test neuspješne prijave

```js
const res = await request(app)
    .post('/login')
    .send({
        email: 'krivi@example.com',
        lozinka: 'krivo',
    });
```

Ovdje se namjerno šalju pogrešni podaci.

Provjera rezultata:

```js
expect(res.statusCode).toBe(401);
expect(res.body).toHaveProperty('error');
```

Ovdje se provjerava:

- da backend vraća `401 Unauthorized`
- da u odgovoru postoji poruka o grešci

## Što se ovim testom dokazalo

Ovim primjerom je potvrđeno da ruta `/login`:

- ispravno prijavljuje korisnika kad su podaci točni
- ispravno odbija prijavu kad su podaci pogrešni

## Kratka napomena

Na isti način su testirane i ostale rute u projektu, npr.:

- `korisnici`
- `knjige`
- `interakcije`

Za svaku rutu šalje se zahtjev, a zatim se provjerava status odgovora i sadržaj koji backend vraća.
