const express = require('express');
const router = express.Router();
const db = require('../Database/DB');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT * FROM interakcije');
        res.json(rows);
    } catch (err) {
        console.error('Greska pri dohvacanju interakcije:', err);
        res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.get('/knjiga/:knjigaId', async (req, res) => {
    const knjigaId = req.params.knjigaId;
    try {
        const [rows] = await db.pool.query(
            `SELECT i.interakcija_id AS id, i.vrijeme_ostavljanja AS datum, k.ime, k.prezime, i.recenzija AS tekst, i.ocjena
             FROM interakcije i
             INNER JOIN korisnici k ON k.korisnik_id = i.korisnik_id
             WHERE i.knjiga_id = ?
             ORDER BY i.vrijeme_ostavljanja DESC`,
            [knjigaId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Greska pri dohvacanju interakcija:', err);
        res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.post('/', async (req, res) => {
    const {
        korisnik_id,
        knjiga_id,
        ocjena,
        recenzija,
        omiljena,
    } = req.body;

    if (!korisnik_id || !knjiga_id) {
        return res.status(400).json({ error: 'Korisnik i knjiga su obavezni.' });
    }

    try {
        const [result] = await db.pool.query(
            `INSERT INTO interakcije
             (korisnik_id, knjiga_id, ocjena, recenzija, omiljena)
             VALUES (?, ?, ?, ?, ?);`,
            [
                Number(korisnik_id),
                Number(knjiga_id),
                Number(ocjena ?? 0),
                recenzija ?? '',
                Boolean(omiljena ?? false),
            ],
        );

        const [rows] = await db.pool.query('SELECT * FROM interakcije WHERE interakcija_id = ?;', [
            result.insertId,
        ]);

        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Greska pri dodavanju interakcije:', err);
        return res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.put('/:id', async (req, res) => {
    const interakcijaId = req.params.id;
    const {
        korisnik_id,
        knjiga_id,
        ocjena,
        recenzija,
        omiljena,
    } = req.body;

    try {
        const [result] = await db.pool.query(
            `UPDATE interakcije
             SET korisnik_id = ?, knjiga_id = ?, ocjena = ?, recenzija = ?, omiljena = ?
             WHERE interakcija_id = ?;`,
            [
                Number(korisnik_id),
                Number(knjiga_id),
                Number(ocjena ?? 0),
                recenzija ?? '',
                Boolean(omiljena ?? false),
                interakcijaId,
            ],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ Odgovor: 'Azuriranje nije uspjelo' });
        }

        const [rows] = await db.pool.query('SELECT * FROM interakcije WHERE interakcija_id = ?;', [
            interakcijaId,
        ]);

        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

router.delete('/:id', async (req, res) => {
    const interakcijaId = req.params.id;
    try {
        const [result] = await db.pool.query('DELETE FROM interakcije WHERE interakcija_id = ?;', [interakcijaId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ Odgovor: 'Brisanje nije uspjelo' });
        }
        else {
            return res.status(200).json('Interakcija obrisana');
        }
    }
    catch(err) {
        return res.status(500).json(err);
    }
});

module.exports = router;
