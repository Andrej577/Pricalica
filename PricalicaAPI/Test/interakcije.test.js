const request = require('supertest');
const app = require('../index.js');
const { pool } = require('../Database/DB');

let korisnikId;
let drugiKorisnikId;
let treciKorisnikId;
let autorId;
let knjigaId;
let createdInterakcijaId;
let updateInterakcijaId;
let deleteInterakcijaId;

describe('Rute /interakcije', () => {
    beforeAll(async () => {
        const unique = Date.now();

        const [korisnikResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test', 'Korisnik', `test.interakcija.korisnik.${unique}@example.com`, 'test123', 3, 1, false]
        );
        korisnikId = korisnikResult.insertId;

        const [autorResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test', 'Autor', `test.interakcija.autor.${unique}@example.com`, 'test123', 2, 1, false]
        );
        autorId = autorResult.insertId;

        const [drugiKorisnikResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Drugi', 'Korisnik', `test.interakcija.drugi.${unique}@example.com`, 'test123', 3, 1, false]
        );
        drugiKorisnikId = drugiKorisnikResult.insertId;

        const [treciKorisnikResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Treci', 'Korisnik', `test.interakcija.treci.${unique}@example.com`, 'test123', 3, 1, false]
        );
        treciKorisnikId = treciKorisnikResult.insertId;

        const [knjigaResult] = await pool.query(
            `INSERT INTO knjige
            (naslov, autor_id, zanr_id, trajanje_min, opis, statusDostupnosti_id, poveznica, prosjecna_ocjena)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [`Test knjiga ${unique}`, autorId, 1, 60, 'Test knjiga', 1, `test_interakcija_knjiga_${unique}`, 0]
        );
        knjigaId = knjigaResult.insertId;

        const [updateResult] = await pool.query(
            `INSERT INTO interakcije
            (korisnik_id, knjiga_id, ocjena, recenzija, omiljena)
            VALUES (?, ?, ?, ?, ?)`,
            [korisnikId, knjigaId, 4, 'Interakcija za update', false]
        );
        updateInterakcijaId = updateResult.insertId;

        const [deleteResult] = await pool.query(
            `INSERT INTO interakcije
            (korisnik_id, knjiga_id, ocjena, recenzija, omiljena)
            VALUES (?, ?, ?, ?, ?)`,
            [drugiKorisnikId, knjigaId, 3, 'Interakcija za delete', false]
        );
        deleteInterakcijaId = deleteResult.insertId;
    });

    test('GET /interakcije vraca listu interakcija', async () => {
        const res = await request(app).get('/interakcije');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /interakcije/knjiga/:knjigaId vraca recenzije za knjigu', async () => {
        const res = await request(app).get(`/interakcije/knjiga/${knjigaId}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /interakcije kreira interakciju', async () => {
        const res = await request(app)
            .post('/interakcije')
            .send({
                korisnik_id: treciKorisnikId,
                knjiga_id: knjigaId,
                ocjena: 5,
                recenzija: 'Nova admin recenzija',
                omiljena: false,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('interakcija_id');
        expect(res.body).toHaveProperty('recenzija');

        createdInterakcijaId = res.body.interakcija_id;
    });

    test('PUT /interakcije/:id azurira interakciju', async () => {
        const res = await request(app)
            .put(`/interakcije/${updateInterakcijaId}`)
            .send({
                korisnik_id: korisnikId,
                knjiga_id: knjigaId,
                ocjena: 5,
                recenzija: 'Ažurirana recenzija',
                omiljena: true,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('ocjena', 5);
        expect(res.body).toHaveProperty('omiljena', 1);
    });

    test('DELETE /interakcije/:id brise interakciju', async () => {
        const res = await request(app).delete(`/interakcije/${deleteInterakcijaId}`);

        expect(res.statusCode).toBe(200);

        const [rows] = await pool.query(
            'SELECT * FROM interakcije WHERE interakcija_id = ?',
            [deleteInterakcijaId]
        );

        expect(rows.length).toBe(0);
    });

    afterAll(async () => {
        if (createdInterakcijaId) {
            await pool.query('DELETE FROM interakcije WHERE interakcija_id = ?', [createdInterakcijaId]);
        }

        if (updateInterakcijaId) {
            await pool.query('DELETE FROM interakcije WHERE interakcija_id = ?', [updateInterakcijaId]);
        }

        if (knjigaId) {
            await pool.query('DELETE FROM knjige WHERE knjiga_id = ?', [knjigaId]);
        }

        if (korisnikId) {
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [korisnikId]);
        }

        if (drugiKorisnikId) {
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [drugiKorisnikId]);
        }

        if (treciKorisnikId) {
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [treciKorisnikId]);
        }

        if (autorId) {
            await pool.query('DELETE FROM autori WHERE autor_id = ?', [autorId]);
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [autorId]);
        }

    });
});
