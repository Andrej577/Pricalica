const express = require('express');
const router = express.Router();
const db = require('../Database/DB');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT * FROM zanrovi');
        res.json(rows);
    } catch (err) {
        console.error('Greška pri dohvaćanju zanrova:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

router.delete('/:id', async (req, res) =>
{
    const zanrId = req.params.id;
    try
    {
        const [rows] = await db.pool.query("DELETE FROM zanrovi WHERE zanr_id = ?;", [zanrId]);
        if (rows.length === 0)
        {
            return res.status(404).json({ Odgovor: "Brisanje nije uspjelo"});
        }
        else
        {
            return res.status(200).json("Zanr obrisan");
        }
    }
    catch(err)
    {
        return res.status(500).json(err);
    }
})

router.put('/:id', async (req, res) =>
{
    const zanrId = req.params.id;
    const { naziv } = req.body;
    try
    {
        const [rows] = await db.pool.query("UPDATE zanrovi SET naziv = ? WHERE zanr_id = ?;", [naziv, zanrId]);
        if (rows.length === 0)
        {
            return res.status(404).json({ Odgovor: "Ažuriranje nije uspjelo"});
        }
        else
        {
            return res.status(200).json("Zanr je ažuriran");
        }
    }
    catch(err)
    {
        return res.status(500).json(err);
    }
})


module.exports = router;