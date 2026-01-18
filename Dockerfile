# Utiliser une image Node.js légère comme base
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml* ./

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install

# Copier le reste des fichiers du projet
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Construire l'application NestJS
RUN pnpm run build

# --- Étape de production ---
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Exposer le port de l'application
EXPOSE 3000

# Commande de démarrage
CMD ["pnpm", "run", "start:prod"]
