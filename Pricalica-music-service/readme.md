# Opis

## Server

- Server je razvijen u Python 3 koristeći Flask i omogućuje HTTP streaming MP3 datoteka.
- Sever također ima "text to speech" funkcionalnost, te funkcionalnost uplaoda pdf datoteke koja će automatski biti konvertirana u text a potom u audio snimku.
- Konverzija mp3 datoteke u waw an serverskoj strani
- Za konverziju MP3 ➔ WAV koristi se `ffmpeg`, koji mora biti instaliran na serveru.

## Web Sučelje
- Web sučelje (Bootstrap 5) omogućuje:
  - Pregled dostupnih audio (MP3/WAV), PDF i tekstualnih datoteka.
  - Upload PDF dokumenata koji se automatski pretvaraju u tekst i audio
  - Upload teksta direktno putem forme, s automatskom generacijom audio zapisa.
  - Streamanje i preslušavanje audio snimki direktno preko preglednika.

# Detalji

- Server se može pokrenuti samostalno korištenjem `server.py` ili putem Docker kontejnera.
- Klijentske aplikacije se ne pokreću se iz Dockera, već direktno na uređaju.
- Server otvara port 5000 za pristup MP3 streamingu i konverziji teksta u audio te uploadu i konverziji pdf-a.

# Primjer korištenja

- Preslušavanje audio datoteke:

``` 
http://localhost:5000/stream?file=audio.mp3
```

- Konverzija teksta u audio datoteku:

| Element         | Vrijednost |
|:----------------|:-----------|
| URL             | `http://localhost:5000/generate` |
| Metoda          | `POST` |
| Content-Type    | `application/json` |
| Tijelo zahtjeva | `{ "text": "nekakav tekst", "lang": "en", "filename": "ime_datoteke" }` |

- Primjer uplaoda pdf datoteke: 

```bash
curl -X POST -F "pdf=@/home/user/Documents/test.pdf" http://localhost:5000/upload_pdf
```
# Docker

- Docker kontejner pokreće samo server.
- MP3 datoteke se spremaju i čitaju iz lokalne serverske mape `/audio`.
- Klijenti se mogu pokrenuti lokalno ili koristiti web preglednik i url endpoint za pristup serveru.

## Docker - Pokretanje projekta

Za pokretanje servera putem Dockera iz glavne mape projekta:

```
docker compose up
```

# Extra

- Upravljanje Docker kontejnerima moguće je putem grafičkog sučelja koristeći Portainer.
- Portainer je poseban kontejner koji omogućava jednostavno upravljanje putem web preglednika.
- Preduvjet za korištenje Portainera: Docker mora biti instaliran na uređaju.

# Instalacija Portainera (Ubuntu)

Pokreni sljedeću naredbu za instalaciju Portainera:

```
sudo docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce
```

# Docker - Portainer komande

- Pokretanje Portainer kontejnera:

```
docker compose -f portainer-compose.yml up -d
```

- Pristup Portainer GUI:

```
http://localhost:9000
```

- Primjer korisničkog imena i lozinke:
  - Username: `admin`
  - Password: `adminadmin12`

# ffmpeg zahtjev

Za konverziju MP3 u WAV format, server koristi biblioteku `pydub` koja zahtijeva instaliran `ffmpeg`(ovo vrijedi za sustav koji ne radi u Docker-u).

**Instalacija ffmpeg:**

Ubuntu/Debian:
```
sudo apt update
sudo apt install ffmpeg
```

# Kratki sažetak

| Komponenta | Tehnologija |
|:--|:--|
| Server | Python3 + Flask |
| TTS | Python3 + gTTS |
| PdfToText | Python3 + PyMuPDF |
| Audio konverzija	| Python3 + pydub + ffmpeg |
| Frontend | Bootstrap 5 (HTML5) |
| Docker | Docker Compose za server |
| GUI upravljanje Dockerom | Portainer |
