const request = require('supertest');
const app = require('../index.js');
const { pool } = require('../Database/DB');

describe('Ostale API rute', () => {
    test('GET / vraca osnovnu poruku API-ja', async () => {
        const res = await request(app).get('/');

        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Api main');
    });

    test('GET /analitika vraca listu analitike', async () => {
        const res = await request(app).get('/analitika');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /povijest_slusanja vraca listu povijesti', async () => {
        const res = await request(app).get('/povijest_slusanja');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /zanrovi vraca listu zanrova', async () => {
        const res = await request(app).get('/zanrovi');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

});
