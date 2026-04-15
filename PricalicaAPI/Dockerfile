FROM node:20

WORKDIR /app

# Instaliraj pakete
RUN npm install cors express mysql2 dotenv jest supertest

# Kopiraj ostatak aplikacije
COPY . .

# Port koji app koristi
EXPOSE 3000

# Start
CMD ["npm", "start"]
