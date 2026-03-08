# AviFarm — Documentation du projet

> Système de gestion d'élevage de poulets (lots, races, oeufs, incubations, ventes, mortalités)

---

## Sommaire

| Fichier | Contenu |
|--------|---------|
| [PROJECT.md](PROJECT.md) | Ce fichier — vue d'ensemble, architecture, stack technique |
| [DATABASE.md](DATABASE.md) | Schéma relationnel, tables SQL, vue `v_NombreActuelPoulets` |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Docker Compose, init SQL, variables d'environnement |
| [RACES.md](RACES.md) | Gestion des races et modèle de croissance `CroissanceRace` |
| [LOTS.md](LOTS.md) | Gestion des lots, situation financière, calcul du bénéfice |
| [MORTALITES.md](MORTALITES.md) | Enregistrement des mortalités, validation de stock |
| [OEUFS.md](OEUFS.md) | Collecte d'oeufs, compteur incubés / restants |
| [INCUBATIONS.md](INCUBATIONS.md) | Workflow complet d'incubation et création automatique de lot |
| [VENTES.md](VENTES.md) | Vente d'oeufs et de poulets, validation de stock, affichage erreurs |
| [DASHBOARD.md](DASHBOARD.md) | Tableau de bord : statistiques globales, situation par lot, KPI |

---

## 1. Vue d'ensemble

**AviFarm** est une application web de gestion d'un élevage avicole.

| Caractéristique | Valeur |
|-----------------|--------|
| Domaine | Élevage de poulets (Madagascar) |
| Devise | Ariary (Ar) |
| Unité de poids | grammes (g) |
| Backend | Node.js 20 + Express 5 — port 3000 |
| Base de données | SQL Server 2022 Express — port 1433 |
| Frontend | Angular 21 SSR — port 4200 |

---

## 2. Architecture générale

```
┌──────────────────────────────────────────────────────────────────┐
│                         Navigateur / SSR                         │
│                      Angular 21  (port 4200)                     │
│                   features/ + services/ + models/                │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP/REST (JSON)
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Backend Node.js + Express 5                   │
│                          (port 3000)                             │
│        routes/ → controllers/ → models/ (logique métier)        │
└───────────────────────────┬──────────────────────────────────────┘
                            │ mssql pool
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│               SQL Server 2022 Express (Docker)                   │
│                 Base de données : ElevagePoulets                 │
└──────────────────────────────────────────────────────────────────┘
```

**Règle d'architecture** : toute la logique métier (calculs, validations, agrégations) est implémentée **côté backend** (models Node.js). Le frontend Angular se limite à l'affichage et à la saisie.

---

## 3. Stack technique

### Backend

| Dépendance | Version | Rôle |
|------------|---------|------|
| `express` | ^5.2.1 | Framework HTTP |
| `mssql` | ^12.2.0 | Connecteur SQL Server |
| `dotenv` | ^17.3.1 | Variables d'environnement |
| `cors` | ^2.8.6 | Politique CORS |
| `nodemon` | ^3.1.14 | Rechargement automatique (dev) |

### Frontend

| Dépendance | Version | Rôle |
|------------|---------|------|
| `@angular/core` | ^21.2.0 | Framework Angular |
| `@angular/router` | ^21.2.0 | Routage SPA |
| `@angular/forms` | ^21.2.0 | Formulaires réactifs |
| `@angular/ssr` | ^21.2.1 | Server-Side Rendering |
| `rxjs` | ~7.8.0 | Programmation réactive |
| `typescript` | ~5.9.2 | Typage statique |

---

## 4. Pattern MVC (backend)

```
routes/[ressource].routes.js           → définition des URLs Express
controllers/[ressource].controller.js  → logique HTTP (req/res/next)
models/[ressource].model.js            → requêtes SQL paramétrées + calculs
```

- `index.js` : démarre le serveur, ouvre le pool SQL, gère `SIGINT`/`SIGTERM`
- `app.js` : configure Express (CORS, JSON, routes, logger, gestionnaire d'erreurs)
- `config/db.js` : singleton de pool `mssql` (max 10 connexions)
- Middleware logger : `[date] MÉTHODE /url → STATUS (Xms)`

---

## 5. Routage frontend

| URL | Composant | Description |
|-----|-----------|-------------|
| `/` | redirect | → `/dashboard` |
| `/dashboard` | `DashboardComponent` | Vue d'ensemble et situation des lots |
| `/races` | `RacesComponent` | CRUD des races |
| `/lots` | `LotsComponent` | CRUD des lots |
| `/mortalites` | `MortalitesComponent` | Enregistrement des mortalités |
| `/oeufs` | `OeufsComponent` | Collecte d'oeufs |
| `/incubations` | `IncubationsComponent` | Gestion des incubations |
| `/vente-oeufs` | `VenteOeufsComponent` | Ventes d'oeufs |
| `/vente-poulets` | `VentePouletsComponent` | Ventes de poulets |
| `/cout-achat` | `CoutAchatComponent` | Coûts d'achat des poussins |

Tous les composants sont **lazy-loaded**.

---

## 6. Composant partagé : ModalComponent

Modale CRUD réutilisable (`shared/components/modal/`).

| Input | Type | Description |
|-------|------|-------------|
| `title` | string | Titre de la modale |
| `show` | boolean | Afficher / masquer |
| `saving` | boolean | Désactive le bouton pendant save |
| `saveBtnLabel` | string | Libellé du bouton (défaut : Sauvegarder) |
| `saveBtnClass` | string | Classes CSS du bouton |

| Output | Description |
|--------|-------------|
| `closed` | Émis à la fermeture |
| `saved` | Émis pour confirmer la sauvegarde |

---

## 7. Structure des fichiers

```
prog s4/
├── docker-compose.yml
├── docs/
│   ├── PROJECT.md          ← ce fichier (index)
│   ├── DATABASE.md
│   ├── INFRASTRUCTURE.md
│   ├── RACES.md
│   ├── LOTS.md
│   ├── MORTALITES.md
│   ├── OEUFS.md
│   ├── INCUBATIONS.md
│   ├── VENTES.md
│   └── DASHBOARD.md
├── docker/
│   └── init/
│       ├── database.sql
│       └── init.sh
├── backend/
│   ├── index.js
│   ├── app.js
│   ├── package.json
│   ├── config/db.js
│   ├── models/
│   ├── controllers/
│   └── routes/
└── frontend/
    ├── package.json
    ├── angular.json
    └── src/
        └── app/
            ├── core/          # constants, models, services, interceptors
            ├── features/      # pages lazy-loaded
            ├── layout/        # header, sidebar, footer, main-layout
            └── shared/        # ModalComponent
```

---

*Dernière mise à jour : juin 2025*
