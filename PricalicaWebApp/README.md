# PricalicaWebApp

Upute za pokretanje aplikacije lokalno i kroz Docker.

## Pokretanje aplikacije lokalno

Za pokretanje aplikacije direktno s računala koristi Quasar development server.

### Instalacija ovisnosti

```bash
npm install
```

### Pokretanje aplikacije

```bash
quasar dev
```

Aplikacija će nakon toga biti dostupna na development portu koji Quasar prijavi u terminalu.

## Pokretanje aplikacije kroz Docker

Aplikacija se može pokrenuti i kroz Docker. U tom slučaju je projekt bindan na Docker container, što znači da se lokalne promjene u kodu odmah vide unutar aplikacije bez ponovnog pokretanja cijelog Docker okruženja.

### Pokretanje Docker okruženja

```bash
docker compose up --build
```

### Gašenje Docker okruženja

```bash
docker compose down
```

## Napomena za development kroz Docker

Docker setup koristi bind mount na projekt direktorij. Zbog toga se svaka promjena u lokalnom source kodu automatski reflektira unutar containera, a aplikacija prikazuje promjene bez potrebe za ručnim restartanjem cijelog Docker okruženja.

Ako je uključen Quasar/Vite hot reload, promjene će biti vidljive odmah nakon spremanja datoteka.
## Zadani testni korisnici

Za prijavu u aplikaciju dostupni su sljedeci racuni iz pocetne baze:

- `admin`: `maja.peric@example.com` / `Maja*Secure5`
- `user`: `sara.juric@example.com` / `SaraLove44`
