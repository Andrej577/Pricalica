const request = require('supertest');
const app = require('../index.js');
const { pool } = require('../Database/DB');

let korisnikId;
let autorId;
let knjigaId;
let povijestId;

describe('Rute /povijest_slusanja', () => {
    beforeAll(async () => {
        const unique = Date.now();

        const [korisnikResult] = await pool.query(
            `INSERT INTO korisnici
             (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Play', 'Listener', `test.povijest.korisnik.${unique}@example.com`, 'test123', 3, 1, false],
        );
        korisnikId = korisnikResult.insertId;

        const [autorResult] = await pool.query(
            `INSERT INTO korisnici
             (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id, ima_pretplatu)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Play', 'Author', `test.povijest.autor.${unique}@example.com`, 'test123', 2, 1, false],
        );
        autorId = autorResult.insertId;

        const [knjigaResult] = await pool.query(
            `INSERT INTO knjige
             (naslov, autor_id, zanr_id, trajanje_min, opis, statusDostupnosti_id, poveznica, prosjecna_ocjena)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [`Test reprodukcija ${unique}`, autorId, 1, 60, 'Test knjiga', 1, 'sample.mp3', 4.5],
        );
        knjigaId = knjigaResult.insertId;
    });

    test('POST /povijest_slusanja/sync kreira ili azurira povijest i analitiku', async () => {
        const createRes = await request(app)
            .post('/povijest_slusanja/sync')
            .send({
                korisnik_id: korisnikId,
                knjiga_id: knjigaId,
                pozicija: 42,
                statusSlusanja_id: 1,
                inkrementiraj_slusanje: true,
                vrijeme_slusanja: 42,
            });

        expect([200, 201]).toContain(createRes.statusCode);
        expect(createRes.body).toHaveProperty('povijest_id');
        expect(createRes.body).toHaveProperty('pozicija', 42);

        povijestId = createRes.body.povijest_id;

        const historyRes = await request(app)
            .get(`/povijest_slusanja/korisnik/${korisnikId}/knjiga/${knjigaId}`);

        expect(historyRes.statusCode).toBe(200);
        expect(historyRes.body).toHaveProperty('pozicija', 42);

        const [analyticsRows] = await pool.query(
            'SELECT * FROM analitika WHERE knjiga_id = ? AND datum = CURDATE()',
            [knjigaId],
        );

        expect(analyticsRows.length).toBe(1);
        expect(Number(analyticsRows[0].broj_slusanja)).toBe(1);
        expect(Number(analyticsRows[0].vrijeme_slusanja)).toBeGreaterThanOrEqual(42);
    });

    afterAll(async () => {
        if (povijestId) {
            await pool.query('DELETE FROM povijest_slusanja WHERE povijest_id = ?', [povijestId]);
        }

        if (knjigaId) {
            await pool.query('DELETE FROM analitika WHERE knjiga_id = ?', [knjigaId]);
            await pool.query('DELETE FROM knjige WHERE knjiga_id = ?', [knjigaId]);
        }

        if (korisnikId) {
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [korisnikId]);
        }

        if (autorId) {
            await pool.query('DELETE FROM autori WHERE autor_id = ?', [autorId]);
            await pool.query('DELETE FROM korisnici WHERE korisnik_id = ?', [autorId]);
        }
    });
});
