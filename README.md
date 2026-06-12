# Invoice Management App

Application de gestion de factures et devis avec React (frontend) et Express + Prisma (backend).

## Prérequis

- Node.js >= 18
- npm

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Yahia-profil/invoice-app.git
cd invoice-app

# 2. Installer les dépendances du frontend
npm install

# 3. Installer les dépendances du backend
cd backend
npm install
cd ..
```

## Base de données (SQLite + Prisma)

```bash
cd backend

# Générer le client Prisma
npx prisma generate

# Créer/Mettre à jour la base de données SQLite
npx prisma db push

# (Optionnel) Remplir la base avec des données de test
npx tsx src/seed.ts

cd ..
```

## Lancement

### Backend (port 4000)

```bash
cd backend
npm run dev
```

### Frontend React (port 3000)

Dans un autre terminal :

```bash
npm start
```

### Serveur JSON de secours (port 3001)

Si besoin du serveur JSON alternatif :

```bash
npm run json-server
```

## Scripts disponibles

### Frontend (racine)

| Commande | Description |
|----------|-------------|
| `npm start` | Lance l'application React |
| `npm run build` | Build de production |
| `npm test` | Lance les tests |
| `npm run json-server` | Lance json-server sur db.json (port 3001) |

### Backend (`backend/`)

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur en mode développement (tsx watch) |
| `npm run build` | Compile TypeScript |
| `npm start` | Lance le serveur compilé |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Synchronise le schéma Prisma avec la base SQLite |
| `npm run db:seed` | Insère les données de test |
