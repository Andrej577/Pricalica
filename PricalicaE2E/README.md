# 4.3.2. Izrada funkcijskih end-user testova

Funkcijski end-user testovi u projektu `Pricalica` provjeravaju rad aplikacije iz perspektive krajnjeg korisnika. Za razliku od unit testova, ovdje se ne testiraju pojedinačne funkcije ili metode izolirano, nego cijeli korisnički tokovi kroz korisničko sučelje, navigaciju i komunikaciju s backend API-jem.

U ovom projektu funkcijski testovi služe za provjeru:

- otvaranja i prikaza stranica bez greške
- prijave korisnika i administratora
- navigacije između stranica
- rada obrazaca i unosa podataka
- poziva prema backend API-ju
- prikaza podataka dohvaćenih s API-ja
- prikaza poruka o greškama kada API ne vrati očekivane podatke
- rada administratorskih funkcionalnosti iz korisničkog sučelja

Za izradu funkcijskih testova korišten je **Playwright**, jer omogućuje pouzdano testiranje stvarnog rada web aplikacije u pregledniku, rad s modernim frontend aplikacijama, presretanje mrežnih zahtjeva i izvođenje testova lokalno ili unutar Docker okruženja.

## Alat i tehnologije

- alat za E2E testiranje: `Playwright`
- jezik: `JavaScript`
- frontend aplikacija: `Vue 3 + Quasar`
- backend aplikacija: `Node.js + Express`
- baza podataka: `MySQL`
- način pokretanja testova:
  - lokalno iz Node okruženja
  - u Docker containeru pomoću službene Playwright slike

## Lokacija E2E projekta

Funkcijski testovi nalaze se u zasebnom projektu:

- mapa: `PricalicaE2E`
- glavna test datoteka: `tests/e2e/app.spec.js`
- konfiguracija Playwrighta: `playwright.config.js`
- Docker konfiguracija za Playwright: `docker-compose.yml`

Ovakva organizacija odvaja E2E testove od samog frontenda i backenda te olakšava njihovo samostalno pokretanje i održavanje.

## Svrha testova u ovom projektu

Cilj funkcijskih testova je potvrditi da najvažniji korisnički tokovi aplikacije rade ispravno kada se svi dijelovi sustava koriste zajedno:

- frontend korisničko sučelje
- Vue router i navigacija
- backend API
- baza podataka

Time se provjerava integracija više komponenti sustava, a ne samo izolirana logika pojedinog modula.

## Playwright konfiguracija u projektu

Konfiguracija je definirana u datoteci `PricalicaE2E/playwright.config.js`.

Bitne značajke konfiguracije:

- testovi se nalaze u mapi `tests/e2e`
- koristi se projekt `chromium`
- ukupni timeout po testu je `30 sekundi`
- timeout za `expect` provjere je `10 sekundi`
- screenshot se sprema samo kod pada testa
- video se zadržava kod pada testa
- reporter je postavljen na `list`

Ako vanjski frontend URL nije zadan, Playwright automatski pokreće Quasar razvojni server na:

- `http://127.0.0.1:9000`

Ako se testovi izvode u Dockeru, koriste se varijable:

- `PLAYWRIGHT_BASE_URL=http://host.docker.internal:9000`
- `PLAYWRIGHT_API_URL=http://host.docker.internal:3000`

To znači da Playwright u Docker kontejneru pristupa frontend i backend servisima pokrenutima na host računalu.

## Datoteke i struktura

Najvažnije datoteke za E2E testiranje su:

- `PricalicaE2E/package.json`
- `PricalicaE2E/playwright.config.js`
- `PricalicaE2E/docker-compose.yml`
- `PricalicaE2E/tests/e2e/app.spec.js`

Glavna test datoteka sadrži:

- pomoćne funkcije za prijavu korisnika i administratora
- scenarije koji testiraju korisničke i administratorske funkcionalnosti
- API pozive za pripremu testnih podataka
- presretanje API zahtjeva za simulaciju greške

## Preduvjeti za pokretanje

Za uspješno pokretanje funkcijskih testova potrebno je:

- da backend API radi na portu `3000`
- da frontend aplikacija radi na portu `9000`
- da baza podataka sadrži inicijalne korisnike i knjige iz `PricalicaDB/init.sql`
- da postoje testni korisnici:
  - administrator: `maja.peric@example.com`
  - korisnik: `sara.juric@example.com`
- da frontend i backend koriste međusobno ispravne API adrese

Za lokalni rad Playwright može sam pokrenuti frontend, ali backend i baza moraju biti dostupni.

## Instalacija alata

Iz mape `PricalicaE2E` potrebno je instalirati ovisnosti:

```bash
npm install
npx playwright install
```

## Način pokretanja testova

### Lokalno pokretanje

Ako su frontend i backend već pokrenuti:

```bash
npm run test:e2e
```

Pokretanje s vidljivim preglednikom:

```bash
npm run test:e2e:headed
```

Pokretanje kroz Playwright UI:

```bash
npm run test:e2e:ui
```

### Pokretanje u Dockeru

Iz mape `PricalicaE2E`:

```bash
docker compose up --build --abort-on-container-exit playwright
```

Gašenje i uklanjanje volumena:

```bash
docker compose down -v
```

## Testirani korisnički scenariji

U projektu je implementirano šest glavnih funkcijskih scenarija.

### 1. Prijava korisnika preko korisničke forme

Scenarij provjerava može li se unaprijed definirani korisnik uspješno prijaviti kroz korisničku login formu.

Koraci:

1. otvara se početna login stranica
2. unose se korisnički podaci u formu za korisnika
3. klikne se gumb za prijavu korisnika
4. očekuje se preusmjerenje na `/pocetna`
5. provjerava se da je vidljiv sadržaj biblioteke

Svrha testa:

- validacija login forme
- provjera rada API rute `/login`
- provjera spremanja stanja prijave i preusmjerenja

### 2. Pretraga knjiga na početnoj stranici

Scenarij provjerava radi li filtriranje knjiga nakon prijave korisnika.

Koraci:

1. korisnik se prijavljuje u sustav
2. otvara se početna stranica s knjižnicom
3. u tražilicu se upisuje naziv knjige `Tajna vrta`
4. očekuje se da tražena knjiga ostane vidljiva
5. očekuje se da knjiga `Ponoćni vlak` više nije prikazana

Svrha testa:

- provjera rada tražilice
- provjera ispravnog prikaza filtriranih podataka

### 3. Otvaranje detalja knjige

Scenarij provjerava može li korisnik otvoriti detalje pojedine knjige i vidi li potrebne informacije.

Koraci:

1. korisnik se prijavljuje u sustav
2. klikne na knjigu `Tajna vrta`
3. očekuje se otvaranje rute oblika `/knjige/:id`
4. provjerava se prikaz naslova knjige
5. provjerava se prikaz autora
6. provjerava se sekcija recenzija

Svrha testa:

- provjera navigacije na detalje knjige
- provjera dohvaćanja i prikaza podataka o knjizi
- provjera prikaza recenzija

### 4. Uređivanje korisnika u administratorskom dijelu

Scenarij provjerava može li administrator urediti korisnika kroz admin sučelje.

Koraci:

1. preko API-ja se kreira testni korisnik
2. administrator se prijavljuje
3. otvara se stranica `/admin/korisnici`
4. u tablici se pronalazi kreirani korisnik
5. korisnik se odabire i otvara se akcija `Uredi`
6. administrator se preusmjerava na detalje korisnika
7. mijenja se ime korisnika
8. spremaju se izmjene
9. očekuje se poruka o uspješnom spremanju
10. testni korisnik se briše preko API-ja

Svrha testa:

- provjera admin prijave
- provjera admin navigacije
- provjera rada tablice korisnika
- provjera spremanja izmjena korisnika

### 5. Brisanje korisnika uz potvrdu dijaloga

Scenarij provjerava administratorsko brisanje korisnika kroz potvrdu dijaloga.

Koraci:

1. preko API-ja se kreira testni korisnik
2. administrator se prijavljuje
3. otvara se stranica `/admin/korisnici`
4. odabire se korisnik u tablici
5. klikne se akcija `Izbriši`
6. provjerava se prikaz dijaloga `Potvrda brisanja`
7. potvrđuje se brisanje
8. očekuje se poruka `Korisnik je obrisan.`

Svrha testa:

- provjera rada administratorskog brisanja
- provjera prikaza potvrde prije brisanja
- provjera ažuriranja podataka nakon brisanja

### 6. Prikaz greške ako API ne vrati podatke

Scenarij provjerava ponašanje aplikacije u slučaju greške backend API-ja.

Koraci:

1. Playwright presreće zahtjev prema ruti `**/knjige`
2. umjesto stvarnog odgovora vraća se HTTP `500`
3. korisnik se prijavljuje
4. očekuje se poruka `Neuspjelo učitavanje knjiga.`

Svrha testa:

- provjera otpornosti aplikacije na backend greške
- provjera prikaza korisničke poruke o grešci

## Korišteni testni podaci

Za login scenarije koriste se unaprijed definirani podaci iz baze:

- administrator:
  - email: `maja.peric@example.com`
  - lozinka: `Maja*Secure5`
- korisnik:
  - email: `sara.juric@example.com`
  - lozinka: `SaraLove44`

Za admin scenarije kreiraju se privremeni korisnici pomoću jedinstvenog vremenskog žiga (`Date.now()`), čime se izbjegava konflikt s postojećim zapisima u bazi.

## Način implementacije testova

U testovima se koriste sljedeći pristupi:

- `page.goto()` za otvaranje stranica
- `locator()` i `getByTestId()` za dohvat elemenata
- `expect()` za provjeru URL-a, vidljivosti i stanja elemenata
- `page.request` za pripremu testnih podataka preko backend API-ja
- `page.route()` za simulaciju greške backend servisa

Posebno je uveden pomoćni mehanizam za učitavanje login stranice koji pokušava ponovno otvoriti stranicu ako frontend vrati `ERR_EMPTY_RESPONSE`. To je dodano zbog povremenih nestabilnosti Quasar/Vite razvojnog servera u Docker E2E okruženju.

## Što se ovim testovima stvarno potvrđuje

Na temelju postojećih scenarija može se zaključiti da funkcijski testovi u ovom projektu potvrđuju sljedeće:

- aplikacija se može otvoriti i koristiti iz preglednika
- prijava radi za dvije vrste korisnika
- korisnik može pretraživati i pregledavati knjige
- administrator može upravljati korisnicima
- aplikacija ispravno prikazuje greške kada backend ne vrati podatke
- frontend, backend i baza podataka rade povezano unutar jednog korisničkog toka

## Ograničenja i zapažanja iz projekta

Tijekom izvođenja testova uočen je niz praktičnih zapažanja:

- E2E testovi ovise o dostupnosti frontenda na portu `9000`
- E2E testovi ovise o dostupnosti API-ja na portu `3000`
- Docker okruženje ponekad vraća `ERR_EMPTY_RESPONSE` pri prvom učitavanju stranice
- dio testova ovisi o inicijalnim podacima baze
- pri promjenama u Quasar DOM strukturi selektore treba prilagoditi stvarnom HTML prikazu

Zbog toga je za stabilnost E2E testova važno:

- imati konzistentno inicijaliziranu bazu
- održavati stabilne testne selektore
- paziti na ispravnu konfiguraciju API URL-ova između host i Docker okruženja

## Zaključak

Funkcijski end-user testovi u projektu `Pricalica` služe za provjeru stvarnog rada aplikacije iz perspektive korisnika i administratora. Oni ne provjeravaju samo pojedinačne funkcije, nego kompletne korisničke tokove koji uključuju prikaz stranica, unos podataka, navigaciju, pozive prema API-ju i prikaz grešaka.

Korištenjem Playwrighta omogućeno je automatizirano testiranje najvažnijih scenarija aplikacije. Takvi testovi pomažu pri otkrivanju regresija, potvrđuju da frontend i backend rade zajedno te daju dodatnu sigurnost prije daljnjeg razvoja ili isporuke aplikacije.
