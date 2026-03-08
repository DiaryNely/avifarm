# AviFarm — Base de données

> [← Index](PROJECT.md)

---

## 1. Schéma relationnel

```
Race ──< CroissanceRace
Race ──< Lot ──< Mortalite
              ──< EnregistrementOeufs ──< VenteOeufs
              │                       ──< Incubation ──> Lot (lot_issu_id)
              ──< VentePoulets
              ──< CoutAchat
```

---

## 2. Tables

### `Race`
Définit une race de poulet et ses paramètres économiques/biologiques.

| Colonne | Type | Description |
|---------|------|-------------|
| `race_id` | INT (PK) | Identifiant auto-incrémenté |
| `nom` | VARCHAR(50) | Nom unique de la race |
| `prix_nourrit_g` | DECIMAL(10,2) | Prix nourriture en Ar/g |
| `prix_vente_g` | DECIMAL(10,2) | Prix de vente du poulet en Ar/g |
| `prix_oeuf` | DECIMAL(10,2) | Prix de vente d'un oeuf en Ar |
| `semaine_ponte` | INT | Semaine à partir de laquelle la ponte commence |
| `duree_incubation` | INT | Durée d'incubation en jours |
| `date_creation` | DATETIME | Date d'insertion (défaut : maintenant) |

---

### `CroissanceRace`
Modèle de croissance semaine par semaine pour chaque race.

| Colonne | Type | Description |
|---------|------|-------------|
| `croissance_id` | INT (PK) | Identifiant |
| `race_id` | INT (FK) | Référence vers Race |
| `semaine` | INT | Numéro de semaine (0 = poussin) |
| `poids_initial` | DECIMAL(10,2) | Poids à la semaine 0 (en g) |
| `gain_poids` | DECIMAL(10,2) | Gain de poids hebdomadaire (en g) |
| `nourrit_semaine` | DECIMAL(10,2) | Consommation nourriture/poulet/semaine (g) |

---

### `Lot`
Groupe de poulets de même race, entrés à la même date.

| Colonne | Type | Description |
|---------|------|-------------|
| `lot_id` | INT (PK) | Identifiant |
| `numero` | VARCHAR(20) | Numéro lisible (ex : "Lot 1"), unique |
| `race_id` | INT (FK) | Race du lot |
| `nombre_initial` | INT | Effectif à l'entrée |
| `date_entree` | DATE | Date d'entrée du lot |
| `lot_parent_id` | INT (FK, NULL) | Lot parent si issu d'une incubation |
| `actif` | BIT | 1 = actif, 0 = fermé/vendu |
| `date_creation` | DATETIME | Date d'insertion |

---

### `Mortalite`
Enregistrement des décès dans un lot.

| Colonne | Type | Description |
|---------|------|-------------|
| `mortalite_id` | INT (PK) | Identifiant |
| `lot_id` | INT (FK) | Lot concerné |
| `date_mort` | DATE | Date du décès |
| `nombre_morts` | INT | Nombre de morts (≥ 1) |
| `cause` | VARCHAR(200) | Cause optionnelle |

---

### `EnregistrementOeufs`
Collecte quotidienne d'oeufs par lot.

| Colonne | Type | Description |
|---------|------|-------------|
| `oeuf_id` | INT (PK) | Identifiant |
| `lot_id` | INT (FK) | Lot producteur |
| `date_collecte` | DATE | Date de collecte |
| `nombre_oeufs` | INT | Quantité collectée |

---

### `Incubation`
Traçabilité des oeufs mis en incubation et génération de nouveaux lots.

| Colonne | Type | Description |
|---------|------|-------------|
| `incubation_id` | INT (PK) | Identifiant |
| `oeuf_id` | INT (FK) | Enregistrement d'oeufs source |
| `nombre_incubes` | INT | Nombre d'oeufs incubés |
| `date_debut` | DATE | Début de l'incubation |
| `date_eclosion` | DATE | Date d'éclosion prévue (= date_debut + race.duree_incubation) |
| `lot_issu_id` | INT (FK, NULL) | Lot créé après éclosion réussie |
| `statut` | VARCHAR(20) | `en_cours` / `eclos` / `echoue` |

---

### `VenteOeufs`
Ventes d'oeufs liées à un enregistrement de collecte.

| Colonne | Type | Description |
|---------|------|-------------|
| `vente_id` | INT (PK) | Identifiant |
| `oeuf_id` | INT (FK) | Enregistrement d'oeufs vendu |
| `nombre_vendus` | INT | Quantité vendue |
| `prix_unitaire` | DECIMAL(10,2) | Prix à la vente en Ar |
| `date_vente` | DATE | Date de la vente |
| `montant_total` | COMPUTED | `nombre_vendus × prix_unitaire` |

---

### `VentePoulets`
Ventes de poulets vivants d'un lot.

| Colonne | Type | Description |
|---------|------|-------------|
| `vente_id` | INT (PK) | Identifiant |
| `lot_id` | INT (FK) | Lot vendu |
| `date_vente` | DATE | Date de la vente |
| `nombre_vendus` | INT | Nombre de poulets vendus |
| `poids_moyen_g` | DECIMAL(10,2) | Poids moyen au moment de la vente |
| `prix_vente_g` | DECIMAL(10,2) | Prix par gramme au moment de la vente |
| `montant_total` | COMPUTED | `nombre_vendus × poids_moyen_g × prix_vente_g` |

---

### `CoutAchat`
Coût d'achat initial des poussins pour un lot (1 enregistrement par lot maximum).

| Colonne | Type | Description |
|---------|------|-------------|
| `achat_id` | INT (PK) | Identifiant |
| `lot_id` | INT (FK, UNIQUE) | Lot concerné |
| `cout_total` | DECIMAL(15,2) | Coût d'achat total en Ar |
| `date_achat` | DATE | Date d'achat |
| `notes` | VARCHAR(300) | Notes optionnelles |

---

## 3. Vue SQL

| Vue | Description |
|-----|-------------|
| `v_NombreActuelPoulets` | Calcule le nombre de poulets vivants par lot (`nombre_initial − SUM(morts)`) |

---

## 4. API — Référence des endpoints

Base URL : `http://localhost:3000/api`

### `/api/races`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/races` | Liste toutes les races |
| GET | `/api/races/:id` | Détail d'une race |
| POST | `/api/races` | Créer une race |
| PUT | `/api/races/:id` | Modifier une race |
| DELETE | `/api/races/:id` | Supprimer une race |

### `/api/croissance-race`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/croissance-race` | Tous les modèles de croissance |
| GET | `/api/croissance-race/:id` | Détail d'une entrée |
| POST | `/api/croissance-race` | Ajouter une entrée |
| PUT | `/api/croissance-race/:id` | Modifier |
| DELETE | `/api/croissance-race/:id` | Supprimer |

### `/api/lots`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/lots` | Liste tous les lots |
| GET | `/api/lots/situation` | Situation complète de tous les lots |
| GET | `/api/lots/:id` | Détail d'un lot |
| GET | `/api/lots/:id/situation` | Situation d'un lot spécifique |
| POST | `/api/lots` | Créer un lot |
| PUT | `/api/lots/:id` | Modifier un lot |
| DELETE | `/api/lots/:id` | Supprimer un lot |

### `/api/mortalites`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/mortalites` | Toutes les mortalités |
| GET | `/api/mortalites/lot/:lotId` | Mortalités d'un lot |
| GET | `/api/mortalites/:id` | Détail |
| POST | `/api/mortalites` | Enregistrer une mortalité |
| PUT | `/api/mortalites/:id` | Modifier |
| DELETE | `/api/mortalites/:id` | Supprimer |

### `/api/oeufs`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/oeufs` | Tous les enregistrements |
| GET | `/api/oeufs/lot/:lotId` | Oeufs d'un lot |
| GET | `/api/oeufs/:id` | Détail |
| POST | `/api/oeufs` | Créer un enregistrement |
| PUT | `/api/oeufs/:id` | Modifier |
| DELETE | `/api/oeufs/:id` | Supprimer |

### `/api/incubations`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/incubations` | Toutes les incubations |
| GET | `/api/incubations/:id` | Détail |
| POST | `/api/incubations` | Créer une incubation |
| PUT | `/api/incubations/:id` | Modifier |
| DELETE | `/api/incubations/:id` | Supprimer |

### `/api/vente-oeufs`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/vente-oeufs` | Toutes les ventes |
| GET | `/api/vente-oeufs/:id` | Détail |
| POST | `/api/vente-oeufs` | Enregistrer |
| PUT | `/api/vente-oeufs/:id` | Modifier |
| DELETE | `/api/vente-oeufs/:id` | Supprimer |

### `/api/vente-poulets`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/vente-poulets` | Toutes les ventes |
| GET | `/api/vente-poulets/lot/:lotId` | Ventes d'un lot |
| GET | `/api/vente-poulets/:id` | Détail |
| POST | `/api/vente-poulets` | Enregistrer |
| PUT | `/api/vente-poulets/:id` | Modifier |
| DELETE | `/api/vente-poulets/:id` | Supprimer |

### `/api/cout-achat`

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/cout-achat` | Tous les coûts |
| GET | `/api/cout-achat/lot/:lotId` | Coût d'un lot |
| GET | `/api/cout-achat/:id` | Détail |
| POST | `/api/cout-achat` | Créer un coût |
| PUT | `/api/cout-achat/:id` | Modifier |
| DELETE | `/api/cout-achat/:id` | Supprimer |
