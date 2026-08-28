# Only used by the `full` compose profile, for the whole-topology check.
# Day-to-day development runs `next dev` on the host (D21).
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
