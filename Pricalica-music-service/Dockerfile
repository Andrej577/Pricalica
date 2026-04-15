FROM python:3.12-slim

# Instaliraj sistemske pakete za pygame i Tkinter
RUN apt-get update && apt-get install -y \
    python3-tk \
    tk \
    libasound2-dev \
    libpulse-dev \
    libsdl2-mixer-2.0-0 \
    libsdl2-2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Napravi folder
WORKDIR /app

# Kopiraj sve fajlove
COPY . .

# Instaliraj Python zavisnosti
RUN pip install --no-cache-dir -r requirements.txt

# Expose port za server
EXPOSE 5000

# Pokreni server
CMD ["python", "server.py"]