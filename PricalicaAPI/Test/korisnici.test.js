const request = require('supertest');
const app = require('../index.js');
const { pool } = require('../Database/DB');

let createdUserId;
let updateUserId;
let deleteUserId;
let deleteAuthorId;
let deleteBookId;

describe('Rute /korisnici', () => {
    beforeAll(async () => {
        const unique = Date.now();

        const [updateResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Update', 'Korisnik', `update.korisnik.${unique}@example.com`, 'test123', 3, 1, false]
        );
        updateUserId = updateResult.insertId;

        const [deleteUserResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Delete', 'Korisnik', `delete.korisnik.${unique}@example.com`, 'test123', 3, 1, false]
        );
        deleteUserId = deleteUserResult.insertId;

        const [deleteAuthorResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Delete', 'Autor', `delete.autor.${unique}@example.com`, 'test123', 2, 1, false]
        );
        deleteAuthorId = deleteAuthorResult.insertId;

        const [deleteBookResult] = await pool.query(
            `INSERT INTO knjige
            (naslov, autor_id, zanr_id, trajanje_min, opis, statusDostupnosti_id, poveznica, prosjecna_ocjena)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Delete knjiga', deleteAuthorId, 1, 120, 'Opis testne knjige', 1, `delete_knjiga_${unique}`, 0]
        );
        deleteBookId = deleteBookResult.insertId;

        await pool.query(
            `INSERT INTO interakcije
            (korisnik_id, knjiga_id, ocjena, recenzija, omiljena)
            VALUES (?, ?, ?, ?, ?)`,
            [deleteUserId, deleteBookId, 4, 'Test recenzija', false]
        );
    });

    test('GET /korisnici vraca listu korisnika', async () => {
        const res = await request(app).get('/korisnici');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /korisnici/:id vraca trazenog korisnika', async () => {
        const res = await request(app).get('/korisnici/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('korisnik_id', 1);
        expect(res.body).toHaveProperty('email');
    });

    test('POST /korisnici kreira korisnika', async () => {
        const unique = Date.now();

        const res = await request(app)
            .post('/korisnici')
            .send({
                ime: 'Post',
                prezime: 'Korisnik',
                email: `post.korisnik.${unique}@example.com`,
                lozinka: 'test123',
                tipKorisnika: 3,
                statusRacuna: 1,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('korisnik_id');
        expect(res.body).toHaveProperty('email');

        createdUserId = res.body.korisnik_id;
    });

    test('PUT /korisnici/:id azurira korisnika', async () => {
        const res = await request(app)
            .put(`/korisnici/${updateUserId}`)
            .send({
                ime: 'NovoIme',
                prezime: 'NovoPrezime',
                email: `novo.${updateUserId}@example.com`,
                lozinka: 'novaLozinka123',
                statusRacuna: 2,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('ime', 'NovoIme');
        expect(res.body).toHaveProperty('statusRacuna_id', 2);
    });

    test('DELETE /korisnici/:id brise korisnika', async () => {
        const res = await request(app).delete(`/korisnici/${deleteUserId}`);

        expect(res.statusCode).toBe(200);

        const [rows] = await pool.query(
            'SELECT * FROM korisnici WHERE korisnik_id = ?',
            [deleteUserId]
        );

        expect(rows.length).toBe(0);
    });

    afterAll(async () => {
        if (deleteBookId) {
            await pool.query('DELETE FROM knjige WHERE knjiga_id = ?', [deleteBookId]);
        }

        if (deleteAuthorId) {
            await pool.query('DELETE FROM autori WHERE autor_id = ?', [deleteAuthorId]);
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [deleteAuthorId]);
        }

        if (updateUserId) {
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [updateUserId]);
        }

        if (createdUserId) {
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [createdUserId]);
        }

    });
});
