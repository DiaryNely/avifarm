# Backend Models — AgriPoultry

Documentation complète de tous les modèles de données du backend.

---

## 📁 Structure des fichiers

```
models/
├── race.model.js              # Gestion des races de poulets
├── croissanceRace.model.js    # Courbes de croissance par race
├── lot.model.js               # Gestion des lots (le plus complexe)
├── mortalite.model.js         # Enregistrement des décès
├── enregistrementOeufs.model.js # Collecte d'oeufs
├── incubation.model.js        # Gestion des incubations
├── venteOeufs.model.js        # Vente d'oeufs
├── ventePoulets.model.js      # Vente de poulets
└── coutAchat.model.js         # Coûts d'achat des lots
```

---

## 1. race.model.js — Gestion des races de poulets

Gère les différentes races de poulets avec leurs caractéristiques économiques et biologiques.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Récupère toutes les races, triées par `race_id` |
| `getById(id)` | Récupère une race par son ID |
| `create(data)` | Crée une race avec : `nom`, `prix_nourrit_g`, `prix_vente_g`, `prix_oeuf`, `semaine_ponte`, `duree_incubation` |
| `update(id, data)` | Met à jour tous les champs d'une race |
| `delete(id)` | Supprime une race |

### Champs de la table Race :
- `nom` — Nom de la race (ex: "Brahma", "Rhode Island")
- `prix_nourrit_g` — Prix de la nourriture par gramme (Ariary)
- `prix_vente_g` — Prix de vente par gramme de poulet (Ariary)
- `prix_oeuf` — Prix de vente d'un oeuf (Ariary)
- `semaine_ponte` — Semaine à partir de laquelle la race peut pondre
- `duree_incubation` — Durée d'incubation en jours

---

## 2. croissanceRace.model.js — Courbe de croissance par race

Définit la courbe de croissance (poids et nourriture) semaine par semaine pour chaque race.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Toutes les données de croissance, triées par `race_id` et `semaine` |
| `getByRace(raceId)` | Données de croissance d'une race spécifique |
| `getById(id)` | Un enregistrement de croissance par ID |
| `create(data)` | Crée un point de croissance : `race_id`, `semaine`, `poids_initial`, `gain_poids`, `nourrit_semaine` |
| `update(id, data)` | Met à jour `poids_initial`, `gain_poids`, `nourrit_semaine` |
| `delete(id)` | Supprime un point de croissance |
| `getTableauByRace(raceId)` | **Calcul cumulatif** — voir ci-dessous |

### Fonction spéciale : `getTableauByRace(raceId)`

Retourne un tableau enrichi avec des calculs cumulatifs pour chaque semaine :

```javascript
{
  ...donnéesBrutes,
  poids_actuel: 1250.00,        // Poids cumulé à cette semaine
  nourrit_cumul: 3500.00,       // Nourriture totale consommée
  cout_nourrit_semaine: 150.00, // Coût nourriture de la semaine
  cout_nourrit_cumul: 875.00    // Coût nourriture cumulé
}
```

---

## 3. lot.model.js — Gestion des lots (le plus complexe)

Le modèle central qui gère les lots de poulets et calcule toutes les métriques business.

### Fonctions helpers (internes)

| Fonction | Description |
|----------|-------------|
| `daysBetween(dateEntree, refDate)` | Calcule le nombre de jours entre l'entrée et une date de référence |
| `computePoidsMoyen(croissance, jours)` | **Interpolation linéaire** du poids moyen au jour près |
| `computeNourritureTotal(croissance, jours, nombreActuel)` | Nourriture totale consommée, interpolée au jour × nombre de poulets |
| `buildSituation(...)` | Construit l'objet "situation" complet |
| `fetchRawSituationData(pool, lotId)` | Exécute 7 requêtes en parallèle pour les données de situation |

### Interpolation linéaire (`computePoidsMoyen`)

Le calcul du poids ne se fait pas simplement par semaine, mais **au jour près** :

```javascript
// Exemple : jour 10 (semaine 1 + 3 jours)
poids = poidsSemaine1 + (gainSemaine2 × 3/7)
```

### Méthodes CRUD

| Fonction | Description |
|----------|-------------|
| `getAll()` | Liste tous les lots |
| `getById(id)` | Récupère un lot par ID |
| `create(data)` | Crée un lot : `numero`, `race_id`, `nombre_initial`, `date_entree`, `lot_parent_id` |
| `update(id, data)` | Met à jour un lot (inclut `actif`) |
| `delete(id)` | Supprime un lot |

### Méthodes de situation

| Fonction | Description |
|----------|-------------|
| `getSituation(refDate)` | Situation de **tous les lots** avec calculs métier |
| `getSituationById(id, refDate)` | Situation d'**un lot** spécifique |

### Structure de l'objet "Situation"

```javascript
{
  lot_id: 1,
  numero: "LOT-001",
  race: "Brahma",
  date_entree: "2024-01-15",
  actif: true,
  
  // Temporel
  jour_actuel: 45,
  semaine_actuelle: 6,
  
  // Population
  nombre_actuel: 485,
  total_morts: 12,
  total_vendus: 3,
  taux_mortalite: 2.4,
  
  // Poids
  poids_moyen_g: 1850.50,
  poids_total_g: 897492.50,
  
  // Financier
  valeur_poulets_ar: 4487462.50,
  prix_vente_unitaire_ar: 9253.75,
  nourrit_total_g: 125000.00,
  cout_nourrit_ar: 312500.00,
  
  // Oeufs
  total_oeufs: 150,
  nb_oeufs_vendus: 80,
  revenu_oeufs_ar: 40000.00,
  
  // Bilan
  cout_achat_ar: 250000.00,
  revenu_vente_poulets_ar: 75000.00,
  benefice_ar: -447500.00  // (revenus - coûts)
}
```

---

## 4. mortalite.model.js — Enregistrement des décès

Gère les enregistrements de mortalité avec **validation métier**.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Toutes les mortalités |
| `getByLot(lotId)` | Mortalités d'un lot spécifique |
| `getById(id)` | Une mortalité par ID |
| `create(data)` | Crée avec validation |
| `update(id, data)` | Met à jour avec validation |
| `delete(id)` | Supprime un enregistrement |

### Validation à la création

```javascript
// Vérifie : nombre_morts ≤ poulets vivants
const nombreActuel = nombre_initial - SUM(morts) - SUM(vendus);
if (nombre_morts > nombreActuel) {
  throw Error(`Seulement ${nombreActuel} poulet(s) vivant(s)`); // HTTP 422
}
```

### Validation à la mise à jour

Recalcule les poulets disponibles en tenant compte de l'ancienne valeur :

```javascript
const disponible = nombreActuel + ancienNombreMorts;
```

---

## 5. enregistrementOeufs.model.js — Collecte d'oeufs

Enregistre la collecte quotidienne d'oeufs avec **validation de la semaine de ponte**.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Tous les enregistrements d'oeufs |
| `getByLot(lotId)` | Oeufs collectés pour un lot |
| `getById(id)` | Un enregistrement par ID |
| `create(data)` | Crée avec validation métier |
| `update(id, data)` | Met à jour `date_collecte` et `nombre_oeufs` |
| `delete(id)` | Supprime un enregistrement |

### Validation métier à la création

```javascript
// Vérifie que le lot a atteint la semaine de ponte de sa race
const jours = (date_collecte - date_entree) / (24h);
const semaine = Math.floor(jours / 7);

if (semaine < race.semaine_ponte) {
  throw Error(`La race ${race_nom} ne peut pondre qu'à partir de la semaine ${semaine_ponte}`);
}
```

---

## 6. incubation.model.js — Gestion des incubations

Le modèle le plus sophistiqué avec **transactions multi-tables**.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Liste enrichie avec JOINs (lot, race, oeufs) |
| `getById(id)` | Détails complets d'une incubation |
| `create(data)` | Création avec logique complexe |
| `enregistrerEclosion(id, data)` | Enregistre l'éclosion et crée un nouveau lot |
| `delete(id)` | Supprime et restaure les oeufs |

### Logique de `create(data)`

1. **Validation** : `nombre_incubes` ≤ oeufs disponibles
2. **Calcul automatique** : `date_eclosion` = `date_debut` + `duree_incubation`
3. **Transaction** : Décrémente `nombre_oeufs` dans `EnregistrementOeufs`
4. **Insertion** : Crée l'incubation avec statut `'en_cours'`

### Logique de `enregistrerEclosion(id, data)`

1. **Validation** : Vérifie statut = `'en_cours'`
2. **Génération** : Nom automatique du lot `Ecl-{parent}-{YYMMDD}`
3. **Création** : Nouveau lot de poussins avec `lot_parent_id`
4. **Mise à jour** : Statut → `'eclos'`, lien vers `lot_issu_id`

```javascript
// Retourne les deux entités
return { incubation: {...}, lot_cree: {...} };
```

### Logique de `delete(id)`

- Si statut = `'eclos'` → **Interdit** (lot de poussins existe)
- Sinon → **Restaure** les oeufs dans `EnregistrementOeufs`

---

## 7. venteOeufs.model.js — Vente d'oeufs

CRUD simple pour les ventes d'oeufs.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Toutes les ventes d'oeufs |
| `getById(id)` | Une vente par ID |
| `create(data)` | Crée : `oeuf_id`, `nombre_vendus`, `prix_unitaire`, `date_vente` |
| `update(id, data)` | Met à jour les champs |
| `delete(id)` | Supprime une vente |

---

## 8. ventePoulets.model.js — Vente de poulets

Gère les ventes de poulets avec **validation de disponibilité**.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Toutes les ventes de poulets |
| `getByLot(lotId)` | Ventes d'un lot spécifique |
| `getById(id)` | Une vente par ID |
| `create(data)` | Crée avec validation |
| `update(id, data)` | Met à jour avec validation |
| `delete(id)` | Supprime une vente |

### Validation

```javascript
// Calcul des poulets disponibles
const nombreActuel = nombre_initial - SUM(morts) - SUM(vendus);

if (nombre_vendus > nombreActuel) {
  throw Error(`Seulement ${nombreActuel} poulet(s) disponible(s)`);
}
```

### Champs enregistrés

- `lot_id` — Référence au lot
- `date_vente` — Date de la vente
- `nombre_vendus` — Quantité vendue
- `poids_moyen_g` — Poids moyen par poulet
- `prix_vente_g` — Prix de vente par gramme

---

## 9. coutAchat.model.js — Coûts d'achat des lots

Enregistre le coût d'achat initial de chaque lot.

| Fonction | Description |
|----------|-------------|
| `getAll()` | Tous les coûts d'achat |
| `getByLot(lotId)` | Coût d'un lot (1 seul par lot) |
| `getById(id)` | Un coût par ID |
| `create(data)` | Crée : `lot_id`, `cout_total`, `date_achat`, `notes` |
| `update(id, data)` | Met à jour les champs |
| `delete(id)` | Supprime un coût |

---

## 🔧 Patterns de développement utilisés

### 1. Validation métier
Les modèles `mortalite`, `ventePoulets`, et `enregistrementOeufs` vérifient les contraintes business avant insertion/modification.

### 2. Calculs cumulatifs
`croissanceRace.getTableauByRace()` et `lot.buildSituation()` agrègent les données pour les tableaux de bord.

### 3. Transactions implicites
`incubation.create()` et `incubation.delete()` maintiennent la cohérence entre plusieurs tables.

### 4. Requêtes parallèles
`lot.fetchRawSituationData()` utilise `Promise.all()` pour exécuter 7 requêtes simultanément.

### 5. Interpolation linéaire
`lot.computePoidsMoyen()` calcule le poids au jour près, pas seulement par semaine complète.

---

## 📊 Dépendances entre modèles

```
Race
  └── CroissanceRace (1:N)
  └── Lot (1:N)
        ├── Mortalite (1:N)
        ├── CoutAchat (1:1)
        ├── VentePoulets (1:N)
        ├── EnregistrementOeufs (1:N)
        │     ├── VenteOeufs (1:N)
        │     └── Incubation (1:N)
        │           └── Lot (lot_issu_id) — nouveau lot créé à l'éclosion
        └── Lot (lot_parent_id) — relation parent-enfant
```

---

## 🚀 Utilisation

Tous les modèles sont exportés comme objets avec des méthodes async :

```javascript
const Race = require('./models/race.model');
const Lot = require('./models/lot.model');

// Exemple d'utilisation
const races = await Race.getAll();
const situation = await Lot.getSituation('2024-03-15');
```
