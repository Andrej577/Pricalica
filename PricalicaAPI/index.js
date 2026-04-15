const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

const { testConnection } = require('./Database/DB');

const korisniciRoutes = require('./Routes/korisnici');
const knjigeRoutes = require('./Routes/knjige');
const interakcijeRoutes = require('./Routes/interakcije');
const analitikaRoutes = require('./Routes/analitika');
const povijestRoutes = require('./Routes/povijestSlusanja');
const loginRoutes = require('./Routes/login');
const zanroviRoutes = require('./Routes/zanrovi');

testConnection();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Api main');
});

app.use('/korisnici', korisniciRoutes);
app.use("/knjige", knjigeRoutes);
app.use("/interakcije", interakcijeRoutes);
app.use("/analitika", analitikaRoutes);
app.use("/povijest_slusanja", povijestRoutes);
app.use("/login", loginRoutes);
app.use('/zanrovi', zanroviRoutes);

// huh...ovo mora biti ovako inace Jest(test framework) poludi jer ne moze zatvoriti handle-ove
// sta to znaci?
// ovaj index.js se exportira kao modul u komponentu testova i ostavlja za sobom otvoren app.listen
// i onda Jest pocne zezat jer je u importiranom modulu ostao handle (app.listen event) otvoren
// jer se Jest ne moze vratiti u index.js i zatvorit handle posto ga on nije niti otvorio (njega otvara core/main)
// teoretski app.listen se moze i maknut al nije rjesenje jer necemo svaki event micat iz modula zbog glupih testova
if (require.main === module) {
    testConnection();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server radi na http://localhost:${PORT}`);
    });
}

module.exports = app;