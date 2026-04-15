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
        expect(res.body).toHaveProperty('uloga', 'user');
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

    test('POST /login/register registrira novog standardnog korisnika', async () => {
        const unique = Date.now();
        const email = `register.${unique}@example.com`;

        const res = await request(app)
            .post('/login/register')
            .send({
                ime: 'Novi',
                prezime: 'Korisnik',
                email,
                lozinka: 'Test123!',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Registracija uspjesna');
        expect(res.body).toHaveProperty('korisnik.korisnik_id');
        expect(res.body).toHaveProperty('korisnik.email', email);
        expect(res.body).toHaveProperty('korisnik.uloga', 'user');

        await pool.query('DELETE FROM korisnici WHERE email = ?', [email]);
    });

});
