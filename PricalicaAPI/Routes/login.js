const express = require('express');
const router = express.Router();
const db = require('../Database/DB');

function mapirajUlogu(tipKorisnikaId) {
    return Number(tipKorisnikaId) === 1 ? 'admin' : 'user';
}

// login funkcija
async function login(req, res) {
    const { email, lozinka } = req.body;

    if (!email || !lozinka) {
        return res.status(400).json({ error: 'Email i lozinka su obavezni.' });
    }

    try {
        const [rows] = await db.pool.query(
            'SELECT * FROM korisnici WHERE email = ? AND lozinka_hash = ?',
            [email, lozinka]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Neispravni podaci za prijavu' });
        }

        return res.status(200).json({
            message: 'Prijava uspjesna',
            korisnik_id: rows[0].korisnik_id,
            ime: rows[0].ime,
            prezime: rows[0].prezime,
            email: rows[0].email,
            uloga: mapirajUlogu(rows[0].tipKorisnika_id),
        });
    } catch (err) {
        console.error('Greska kod prijave:', err);
        res.status(500).json({ error: 'Greska na serveru' });
    }
}

async function registracija(req, res) {
    const { ime, prezime, email, lozinka } = req.body;

    if (!ime || !prezime || !email || !lozinka) {
        return res.status(400).json({ error: 'Ime, prezime, email i lozinka su obavezni.' });
    }

    try {
        const [postojeciKorisnik] = await db.pool.query(
            'SELECT korisnik_id FROM korisnici WHERE email = ?',
            [email]
        );

        if (postojeciKorisnik.length > 0) {
            return res.status(409).json({ error: 'Korisnik s tim e-mailom vec postoji.' });
        }

        const [result] = await db.pool.query(
            `INSERT INTO korisnici
            (ime, prezime, email, lozinka_hash, tipKorisnika_id, statusRacuna_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [ime, prezime, email, lozinka, 3, 1]
        );

        const [rows] = await db.pool.query(
            'SELECT korisnik_id, ime, prezime, email, tipKorisnika_id FROM korisnici WHERE korisnik_id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Registracija uspjesna',
            korisnik: {
                korisnik_id: rows[0].korisnik_id,
                ime: rows[0].ime,
                prezime: rows[0].prezime,
                email: rows[0].email,
                uloga: mapirajUlogu(rows[0].tipKorisnika_id),
            },
        });
    } catch (err) {
        console.error('Greska kod registracije:', err);
        return res.status(500).json({ error: 'Greska na serveru' });
    }
}

// POST /login
router.post('/', login);
router.post('/register', registracija);

module.exports = router;
