# AviFarm — Oeufs

> [← Index](PROJECT.md)

---

## 1. Fonctionnalité

La page **Oeufs** (`/oeufs`) permet d'enregistrer la collecte quotidienne d'oeufs par lot, et de visualiser combien ont été incubés ou sont encore disponibles.

---

## 2. Champs d'un enregistrement

| Champ | Description |
|-------|-------------|
| `lot_id` | Lot producteur |
| `date_collecte` | Date de collecte |
| `nombre_oeufs` | Quantité collectée ce jour-là |

---

## 3. Colonnes affichées dans le tableau

| Colonne | Calcul |
|---------|--------|
| **Collecte** | `nombre_oeufs` (brut) |
| **Incubés** | `Σ Incubation.nombre_incubes` liées à cet `oeuf_id` |
| **Restants** | `Collecte − Incubés − Vendus` |

Ces colonnes sont calculées **côté backend** dans `enregistrementOeufs.model.js`, via des sous-requêtes `LEFT JOIN` sur les tables `Incubation` et `VenteOeufs`.

---

## 4. API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/oeufs` | Tous les enregistrements (avec compteurs incubés/vendus) |
| GET | `/api/oeufs/lot/:lotId` | Oeufs d'un lot spécifique |
| GET | `/api/oeufs/:id` | Détail d'un enregistrement |
| POST | `/api/oeufs` | Créer un enregistrement |
| PUT | `/api/oeufs/:id` | Modifier |
| DELETE | `/api/oeufs/:id` | Supprimer (si aucune incubation ou vente liée) |

---

## 5. Frontend

**Fichiers** : `features/oeufs/`

- Tableau avec filtrage par lot
- Affiche les 3 colonnes : Collecte / Incubés / Restants
- CRUD via `ModalComponent`
- Service : `OeufsService` (`core/services/oeufs.service.ts`)

---

## 6. Lien avec les incubations

Un enregistrement d'oeufs (`oeuf_id`) peut être la source d'une ou plusieurs incubations. Le total incubé est agrégé depuis la table `Incubation`. Voir [INCUBATIONS.md](INCUBATIONS.md) pour le workflow complet.

---

## 7. Contraintes métier

- On ne peut pas collecter plus d'oeufs que biologiquement possible (contrôle de cohérence via `semaine_ponte`)
- Le nombre incubé + vendu ne peut pas dépasser `nombre_oeufs` — validé côté backend lors de la création d'une incubation ou d'une vente d'oeufs
