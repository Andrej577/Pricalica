const express = require('express');
const router = express.Router();
const db = require('../Database/DB');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT * FROM povijest_slusanja');
        res.json(rows);
    } catch (err) {
        console.error('Greška pri dohvaćanju povijesti slušanja:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

router.get('/korisnik/:korisnikId/knjiga/:knjigaId', async (req, res) => {
    const korisnikId = Number(req.params.korisnikId);
    const knjigaId = Number(req.params.knjigaId);

    if (!korisnikId || !knjigaId) {
        return res.status(400).json({ error: 'Korisnik i knjiga su obavezni.' });
    }

    try {
        const [rows] = await db.pool.query(
            `SELECT *
             FROM povijest_slusanja
             WHERE korisnik_id = ? AND knjiga_id = ?
             LIMIT 1`,
            [korisnikId, knjigaId],
        );

        if (!rows.length) {
            return res.status(404).json({ error: 'Povijest slušanja nije pronađena.' });
        }

        return res.json(rows[0]);
    } catch (err) {
        console.error('Greška pri dohvaćanju zapisa povijesti slušanja:', err);
        return res.status(500).json({ error: 'Greška na serveru' });
    }
});

router.post('/sync', async (req, res) => {
    const korisnikId = Number(req.body.korisnik_id);
    const knjigaId = Number(req.body.knjiga_id);
    const pozicija = Math.max(0, Number(req.body.pozicija ?? 0));
    const statusSlusanjaId = Number(req.body.statusSlusanja_id ?? 1);
    const inkrementirajSlusanje = Boolean(req.body.inkrementiraj_slusanje);
    const vrijemeSlusanja = Math.max(0, Math.round(Number(req.body.vrijeme_slusanja ?? 0)));

    if (!korisnikId || !knjigaId) {
        return res.status(400).json({ error: 'Korisnik i knjiga su obavezni.' });
    }

    let connection;

    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        const [existingHistoryRows] = await connection.query(
            `SELECT *
             FROM povijest_slusanja
             WHERE korisnik_id = ? AND knjiga_id = ?
             LIMIT 1`,
            [korisnikId, knjigaId],
        );

        let povijestId;

        if (existingHistoryRows.length) {
            povijestId = existingHistoryRows[0].povijest_id;

            await connection.query(
                `UPDATE povijest_slusanja
                 SET pozicija = ?, statusSlusanja_id = ?, posljednje_slusanje = CURRENT_TIMESTAMP
                 WHERE povijest_id = ?`,
                [pozicija, statusSlusanjaId, povijestId],
            );
        } else {
            const [insertResult] = await connection.query(
                `INSERT INTO povijest_slusanja
                 (korisnik_id, knjiga_id, pozicija, statusSlusanja_id)
                 VALUES (?, ?, ?, ?)`,
                [korisnikId, knjigaId, pozicija, statusSlusanjaId],
            );

            povijestId = insertResult.insertId;
        }

        if (inkrementirajSlusanje || vrijemeSlusanja > 0) {
            const [bookRows] = await connection.query(
                'SELECT prosjecna_ocjena FROM knjige WHERE knjiga_id = ? LIMIT 1',
                [knjigaId],
            );

            const prosjecnaOcjena = Number(bookRows[0]?.prosjecna_ocjena ?? 0);
            const [analyticsRows] = await connection.query(
                `SELECT analitika_id, broj_slusanja, vrijeme_slusanja
                 FROM analitika
                 WHERE knjiga_id = ? AND datum = CURDATE()
                 LIMIT 1`,
                [knjigaId],
            );

            if (analyticsRows.length) {
                await connection.query(
                    `UPDATE analitika
                     SET broj_slusanja = broj_slusanja + ?,
                         vrijeme_slusanja = vrijeme_slusanja + ?,
                         prosjecna_ocjena = ?
                     WHERE analitika_id = ?`,
                    [
                        inkrementirajSlusanje ? 1 : 0,
                        vrijemeSlusanja,
                        prosjecnaOcjena,
                        analyticsRows[0].analitika_id,
                    ],
                );
            } else {
                await connection.query(
                    `INSERT INTO analitika
                     (knjiga_id, datum, broj_slusanja, prosjecna_ocjena, vrijeme_slusanja)
                     VALUES (?, CURDATE(), ?, ?, ?)`,
                    [knjigaId, inkrementirajSlusanje ? 1 : 0, prosjecnaOcjena, vrijemeSlusanja],
                );
            }
        }

        const [updatedHistoryRows] = await connection.query(
            'SELECT * FROM povijest_slusanja WHERE povijest_id = ? LIMIT 1',
            [povijestId],
        );

        await connection.commit();
        return res.status(existingHistoryRows.length ? 200 : 201).json(updatedHistoryRows[0]);
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Greška pri sinkronizaciji povijesti slušanja:', err);
        return res.status(500).json({ error: 'Greška na serveru' });
    } finally {
        connection?.release();
    }
});

router.delete('/:id', async (req, res) => {
    const povijestId = req.params.id;
    try {
        const [result] = await db.pool.query('DELETE FROM povijest_slusanja WHERE povijest_id = ?;', [povijestId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ Odgovor: 'Brisanje nije uspjelo' });
        }

        return res.status(200).json('Povijest slušanja obrisana');
    } catch (err) {
        return res.status(500).json(err);
    }
});

router.put('/:id', async (req, res) => {
    const povijestId = req.params.id;
    const { pozicija } = req.body;
    try {
        const [result] = await db.pool.query(
            `UPDATE povijest_slusanja
             SET pozicija = ?, posljednje_slusanje = CURRENT_TIMESTAMP
             WHERE povijest_id = ?;`,
            [Math.max(0, Number(pozicija ?? 0)), povijestId],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ Odgovor: 'Ažuriranje nije uspjelo' });
        }

        return res.status(200).json('Povijest slušanja je ažurirana');
    } catch (err) {
        return res.status(500).json(err);
    }
});

module.exports = router;
