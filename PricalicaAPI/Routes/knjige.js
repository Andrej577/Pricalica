const express = require('express');
const router = express.Router();
const db = require('../Database/DB');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT * FROM knjige');
        res.json(rows);
    } catch (err) {
        console.error('Greska pri dohvacanju knjige:', err);
        res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.get('/:id', async (req, res) => {
    const knjigaId = req.params.id;

    try {
        const [rows] = await db.pool.query(`
            SELECT 
                k.naslov,
                CONCAT(a.ime, ' ', a.prezime) AS autor,
                z.nazivZanra AS zanr,
                k.opis,
                k.poveznica
            FROM knjige k
            INNER JOIN korisnici a ON a.korisnik_id = k.autor_id
            INNER JOIN zanrovi z ON z.zanr_id = k.zanr_id
            WHERE k.knjiga_id = ?;
        `, [knjigaId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Knjiga nije pronadena' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Greska pri dohvacanju knjige:', err);
        res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.post('/', async (req, res) => {
    const {
        naslov,
        autor_id,
        zanr_id,
        trajanje_min,
        opis,
        statusDostupnosti_id,
        poveznica,
        prosjecna_ocjena,
    } = req.body;

    if (!naslov || !autor_id || !zanr_id) {
        return res.status(400).json({ error: 'Naslov, autor i zanr su obavezni.' });
    }

    try {
        const [result] = await db.pool.query(
            `INSERT INTO knjige
             (naslov, autor_id, zanr_id, trajanje_min, opis, statusDostupnosti_id, poveznica, prosjecna_ocjena)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                naslov,
                Number(autor_id),
                Number(zanr_id),
                Number(trajanje_min ?? 0),
                opis ?? '',
                Number(statusDostupnosti_id ?? 1),
                poveznica ?? '',
                Number(prosjecna_ocjena ?? 0),
            ],
        );

        const [rows] = await db.pool.query('SELECT * FROM knjige WHERE knjiga_id = ?;', [
            result.insertId,
        ]);

        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Greska pri dodavanju knjige:', err);
        return res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.delete('/:id', async (req, res) => {
    const knjigaId = req.params.id;

    try {
        const [result] = await db.pool.query('DELETE FROM knjige WHERE knjiga_id = ?;', [knjigaId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ Odgovor: 'Brisanje nije uspjelo' });
        }

        return res.status(200).json('Knjiga obrisana');
    } catch (err) {
        return res.status(500).json(err);
    }
});

router.put('/:id', async (req, res) => {
    const knjigaId = req.params.id;
    const {
        naslov,
        autor_id,
        zanr_id,
        trajanje_min,
        opis,
        statusDostupnosti_id,
        poveznica,
        prosjecna_ocjena,
    } = req.body;

    try {
        const [result] = await db.pool.query(
            `UPDATE knjige
             SET naslov = ?, autor_id = ?, zanr_id = ?, trajanje_min = ?, opis = ?, statusDostupnosti_id = ?, poveznica = ?, prosjecna_ocjena = ?
             WHERE knjiga_id = ?;`,
            [
                naslov,
                Number(autor_id),
                Number(zanr_id),
                Number(trajanje_min ?? 0),
                opis ?? '',
                Number(statusDostupnosti_id ?? 1),
                poveznica ?? '',
                Number(prosjecna_ocjena ?? 0),
                knjigaId,
            ],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ Odgovor: 'Azuriranje nije uspjelo' });
        }

        const [rows] = await db.pool.query('SELECT * FROM knjige WHERE knjiga_id = ?;', [knjigaId]);
        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;
