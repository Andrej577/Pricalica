const request = require('supertest');
const app = require('../index.js');
const { pool } = require('../Database/DB');

let autorId;
let createdBookId;
let updateBookId;
let deleteBookId;

describe('Rute /knjige', () => {
    beforeAll(async () => {
        const unique = Date.now();

        const [autorResult] = await pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Test', 'Autor', `test.knjige.autor.${unique}@example.com`, 'test123', 2, 1, false]
        );
        autorId = autorResult.insertId;

        const [updateBookResult] = await pool.query(
            `INSERT INTO knjige
            (naslov, autor_id, zanr_id, trajanje_min, opis, statusDostupnosti_id, poveznica, prosjecna_ocjena)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Knjiga za update', autorId, 1, 100, 'Opis', 1, `update_book_${unique}`, 0]
        );
        updateBookId = updateBookResult.insertId;

        const [deleteBookResult] = await pool.query(
            `INSERT INTO knjige
            (naslov, autor_id, zanr_id, trajanje_min, opis, statusDostupnosti_id, poveznica, prosjecna_ocjena)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Knjiga za delete', autorId, 1, 90, 'Opis', 1, `delete_book_${unique}`, 0]
        );
        deleteBookId = deleteBookResult.insertId;
    });

    test('GET /knjige vraca listu knjiga', async () => {
        const res = await request(app).get('/knjige');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /knjige/:id vraca detalje knjige', async () => {
        const res = await request(app).get('/knjige/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('naslov');
        expect(res.body).toHaveProperty('autor');
        expect(res.body).toHaveProperty('zanr');
    });

    test('POST /knjige kreira knjigu', async () => {
        const unique = Date.now();

        const res = await request(app)
            .post('/knjige')
            .send({
                naslov: `Post knjiga ${unique}`,
                autor_id: autorId,
                zanr_id: 1,
                trajanje_min: 90,
                opis: 'Nova testna knjiga',
                statusDostupnosti_id: 1,
                poveznica: `post_knjiga_${unique}`,
                prosjecna_ocjena: 0,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('knjiga_id');
        expect(res.body).toHaveProperty('naslov');

        createdBookId = res.body.knjiga_id;
    });

    test('PUT /knjige/:id azurira knjigu', async () => {
        const res = await request(app)
            .put(`/knjige/${updateBookId}`)
            .send({
                naslov: 'Novi naslov knjige',
                autor_id: autorId,
                zanr_id: 1,
                trajanje_min: 120,
                opis: 'Ažurirani opis',
                statusDostupnosti_id: 1,
                poveznica: 'nova_poveznica',
                prosjecna_ocjena: 4.2,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('naslov', 'Novi naslov knjige');
    });

    test('DELETE /knjige/:id brise knjigu', async () => {
        const res = await request(app).delete(`/knjige/${deleteBookId}`);

        expect(res.statusCode).toBe(200);

        const [rows] = await pool.query(
            'SELECT * FROM knjige WHERE knjiga_id = ?',
            [deleteBookId]
        );

        expect(rows.length).toBe(0);
    });

    afterAll(async () => {
        if (createdBookId) {
            await pool.query('DELETE FROM knjige WHERE knjiga_id = ?', [createdBookId]);
        }

        if (updateBookId) {
            await pool.query('DELETE FROM knjige WHERE knjiga_id = ?', [updateBookId]);
        }

        if (autorId) {
            await pool.query('DELETE FROM autori WHERE autor_id = ?', [autorId]);
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [autorId]);
        }

    });
});
