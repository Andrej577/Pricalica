const express = require('express');
const router = express.Router();
const db = require('../Database/DB');

async function dohvatiStanjeSheme(connection) {
    const [tablice] = await connection.query(`
        SELECT TABLE_NAME, COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN ('korisnici', 'knjige', 'interakcije', 'povijest_slusanja', 'analitika', 'autori');
    `);

    const schema = new Map();

    for (const { TABLE_NAME, COLUMN_NAME } of tablice) {
        if (!schema.has(TABLE_NAME)) {
            schema.set(TABLE_NAME, new Set());
        }

        schema.get(TABLE_NAME).add(COLUMN_NAME);
    }

    return schema;
}

function imaTablicu(schema, tableName) {
    return schema.has(tableName);
}

function imaKolonu(schema, tableName, columnName) {
    return schema.get(tableName)?.has(columnName) ?? false;
}

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT * FROM korisnici');
        res.json(rows);
    } catch (err) {
        console.error('Greska pri dohvacanju korisnika:', err);
        res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.get('/:id', async (req, res) => {
    const korisnikId = req.params.id;

    try {
        const [rows] = await db.pool.query('SELECT * FROM korisnici WHERE korisnik_id = ?;', [korisnikId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Korisnik nije pronaden' });
        }

        return res.json(rows[0]);
    } catch (err) {
        console.error('Greska pri dohvacanju korisnika po ID-u:', err);
        return res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.post('/', async (req, res) => {
    const {
        ime,
        prezime,
        email,
        lozinka,
        tipKorisnika,
        statusRacuna,
    } = req.body;

    const tipKorisnikaId = Number(tipKorisnika ?? 3);
    const statusRacunaId = Number(statusRacuna ?? 1);

    if (!ime || !prezime || !email || !lozinka) {
        return res.status(400).json({ error: 'Ime, prezime, email i lozinka su obavezni.' });
    }

    try {
        const [result] = await db.pool.query(
            `INSERT INTO korisnici
             (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [
                ime,
                prezime,
                email,
                lozinka,
                tipKorisnikaId,
                statusRacunaId,
            ],
        );

        const [rows] = await db.pool.query('SELECT * FROM korisnici WHERE korisnik_id = ?;', [
            result.insertId,
        ]);

        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Greska pri dodavanju korisnika:', err);
        return res.status(500).json({ error: 'Greska na serveru' });
    }
});

router.put('/:id', async (req, res) => {
    const korisnikId = req.params.id;
    const {
        ime,
        prezime,
        email,
        lozinka,
        statusRacuna,
        aktivan,
    } = req.body;

    const statusRacunaId = aktivan === false ? 2 : Number(statusRacuna ?? 1);

    try {
        const [result] = await db.pool.query(
            `UPDATE korisnici
             SET ime = ?, prezime = ?, email = ?, lozinka_hash = ?, statusRacuna_id = ?
             WHERE korisnik_id = ?;`,
            [
                ime,
                prezime,
                email,
                lozinka,
                statusRacunaId,
                korisnikId,
            ],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ odgovor: 'Azuriranje nije uspjelo' });
        }

        const [rows] = await db.pool.query('SELECT * FROM korisnici WHERE korisnik_id = ?;', [
            korisnikId,
        ]);

        return res.status(200).json(rows[0]);
    } catch (err) {
        return res.status(500).json(err);
    }
});

router.delete('/:id', async (req, res) => {
    const korisnikId = req.params.id;
    let connection;

    try {
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        const schema = await dohvatiStanjeSheme(connection);

        const [korisnici] = await connection.query(
            'SELECT korisnik_id FROM korisnici WHERE korisnik_id = ?;',
            [korisnikId],
        );

        if (korisnici.length === 0) {
            await connection.rollback();
            return res.status(404).json({ odgovor: 'Brisanje nije uspjelo' });
        }

        let knjigeAutora = [];

        if (imaKolonu(schema, 'knjige', 'autor_id')) {
            const [rows] = await connection.query(
                'SELECT knjiga_id FROM knjige WHERE autor_id = ?;',
                [korisnikId],
            );
            knjigeAutora = rows;
        }

        if (imaKolonu(schema, 'interakcije', 'korisnik_id')) {
            await connection.query('DELETE FROM interakcije WHERE korisnik_id = ?;', [korisnikId]);
        }

        if (imaKolonu(schema, 'povijest_slusanja', 'korisnik_id')) {
            await connection.query('DELETE FROM povijest_slusanja WHERE korisnik_id = ?;', [korisnikId]);
        }

        if (knjigeAutora.length > 0) {
            const knjigaIds = knjigeAutora.map((knjiga) => knjiga.knjiga_id);
            const placeholders = knjigaIds.map(() => '?').join(', ');

            if (imaKolonu(schema, 'analitika', 'knjiga_id')) {
                await connection.query(
                    `DELETE FROM analitika WHERE knjiga_id IN (${placeholders});`,
                    knjigaIds,
                );
            }

            if (imaKolonu(schema, 'interakcije', 'knjiga_id')) {
                await connection.query(
                    `DELETE FROM interakcije WHERE knjiga_id IN (${placeholders});`,
                    knjigaIds,
                );
            }

            if (imaKolonu(schema, 'povijest_slusanja', 'knjiga_id')) {
                await connection.query(
                    `DELETE FROM povijest_slusanja WHERE knjiga_id IN (${placeholders});`,
                    knjigaIds,
                );
            }

            if (imaKolonu(schema, 'knjige', 'autor_id')) {
                await connection.query('DELETE FROM knjige WHERE autor_id = ?;', [korisnikId]);
            }
        }

        if (imaKolonu(schema, 'autori', 'autor_id')) {
            await connection.query('DELETE FROM autori WHERE autor_id = ?;', [korisnikId]);
        }

        const [result] = await connection.query(
            'DELETE FROM korisnici WHERE korisnik_id = ?;',
            [korisnikId],
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ odgovor: 'Brisanje nije uspjelo' });
        }

        await connection.commit();
        return res.status(200).json('Korisnik obrisan');
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Greska pri brisanju korisnika:', err);
        return res.status(500).json({
            error: err.sqlMessage || err.message || 'Brisanje korisnika nije uspjelo.',
        });
    } finally {
        connection?.release();
    }
});

module.exports = router;
