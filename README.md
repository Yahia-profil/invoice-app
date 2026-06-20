# Invoice Management App

Application professionnelle de gestion de factures et devis — **100 % française**.

**Stack technique :** React 19 + TypeScript + MUI v9 (frontend) · Express 5 + Prisma 6 + MySQL (backend)

---

## Prérequis

- Node.js >= 18
- npm
- MySQL (XAMPP, WAMP, ou serveur MySQL standalone)

## Installation rapide

```bash
# 1. Frontend
npm install
copy .env.example .env

# 2. Backend
cd backend
npm install
copy .env.example .env

# 3. Créer la base de données MySQL
# Si vous utilisez XAMPP, lancez MySQL depuis le panneau de contrôle
# Puis créez la base :
mysql -u root -e "CREATE DATABASE IF NOT EXISTS invoice_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Initialiser les tables et les données
cd backend
npx prisma generate
npx prisma db push
npx tsx src/seed.ts
cd ..
```

> **Note :** Si votre mot de passe MySQL est différent de celui par défaut (root sans mot de passe), modifiez `DATABASE_URL` dans `backend/.env`.  
> Format : `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

## Lancement

### Backend (port 4000)
```bash
cd backend
npm run dev
```

### Frontend (port 3000)
Dans un autre terminal :
```bash
npm start
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@invoice.com | admin123 |
| Utilisateur | user@invoice.com | user123 |

Les données de démonstration incluent : 2 utilisateurs, 4 clients, 8 articles, 3 catégories, 4 factures à différents statuts, 2 devis, et 12 entrées d'audit.

## Scripts

### Frontend
| Commande | Description |
|----------|-------------|
| `npm start` | Lance l'application (port 3000) |
| `npm run build` | Build de production |
| `npm test` | Lance les tests |

### Backend (`backend/`)
| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement (tsx watch, port 4000) |
| `npm run build` | Compilation TypeScript |
| `npm start` | Production (JS compilé) |
| `npm run db:seed` | Réinitialiser les données de test |

## Fonctionnalités

### Gestion des factures
- Authentification JWT avec deux rôles (admin / utilisateur)
- CRUD clients avec recherche
- Création et édition de factures avec articles, TVA par catégorie, et remises
- Cycle de vie complet : `brouillon → soumise → validee_admin → signee → en_attente_paiement → payee`
- Validation / rejet par l'administrateur
- Suivi des paiements (date de dépôt, date d'encaissement, type de virement)
- Export PDF des factures avec configuration de la société (adresse, SIRET, etc.)
- Modification des factures en statut brouillon

### Signature numérique
- Génération de paires de clés RSA-2048 par client
- Signature cryptographique des factures (SHA-256 + RSA)
- Vérification de signature intégrée

### Devis
- Création et gestion des devis avec articles
- Liste dédiée avec route `/quotes`
- Export PDF des devis

### Administration
- Panneau d'administration pour gérer les articles et catégories
- Validation des factures soumises
- Configuration des informations de la société (paramètres accessibles depuis le menu latéral)
- Piste d'audit complète (AuditLog) pour chaque action sur les factures

### Interface
- Tableau de bord avec statistiques et graphiques (nombre de factures, montants, statuts)
- Mode sombre / clair
- Interface intégralement en français
- Design responsive avec MUI v9

## Architecture

```
Frontend (React 19 + MUI v9) → API REST → Backend (Express 5 + Prisma) → MySQL
```

### Endpoints API

| Groupe | Routes | Accès |
|--------|--------|-------|
| `/api/auth/*` | Login, register, profil (GET /me) | Public / Authentifié |
| `/api/clients/*` | CRUD clients | Authentifié (admin voit tout) |
| `/api/invoices/*` | CRUD + transitions statut + paiement + audit | Authentifié (admin voit tout) |
| `/api/articles/*` | CRUD articles | Authentifié (écriture : admin) |
| `/api/categories/*` | CRUD catégories | Authentifié (écriture : admin) |
| `/api/quotes/*` | CRUD devis | Authentifié (admin voit tout) |
| `/api/signatures/*` | Clés, signature, vérification | Authentifié (signature : admin) |

## Configuration

### Variables d'environnement

**Frontend** (`.env`) :
```
REACT_APP_API_URL=http://localhost:4000/api
```

**Backend** (`backend/.env`) :
```
PORT=4000
JWT_SECRET=invoice-mgmt-secret-key-change-in-prod
DATABASE_URL="mysql://root:@localhost:3306/invoice_management"
```

> En production, changez impérativement `JWT_SECRET` et utilisez un mot de passe MySQL sécurisé.

### Informations de la société

Accessible depuis le menu latéral → **Paramètres**. Les données sont stockées dans le navigateur (localStorage) et utilisées dans les PDF : nom, adresse, SIRET, email, téléphone, logo.
