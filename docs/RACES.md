# AviFarm — Races & Croissance

> [← Index](PROJECT.md)

---

## 1. Fonctionnalité

La page **Races** (`/races`) permet de gérer les races de poulets et leurs paramètres économiques et biologiques, ainsi que leur modèle de croissance semaine par semaine.

---

## 2. Paramètres d'une race

| Paramètre | Description |
|-----------|-------------|
| `nom` | Nom unique de la race |
| `prix_nourrit_g` | Coût de la nourriture en Ar/g consommé |
| `prix_vente_g` | Prix de vente du poulet en Ar/g (valeur par défaut pour les ventes) |
| `prix_oeuf` | Prix de vente d'un oeuf en Ar (valeur par défaut pour les ventes d'oeufs) |
| `semaine_ponte` | Semaine à partir de laquelle les femelles commencent à pondre |
| `duree_incubation` | Durée d'incubation en jours (utilisée pour calculer `date_eclosion`) |

---

## 3. Modèle de croissance : `CroissanceRace`

Chaque race peut avoir un tableau de croissance semaine par semaine.

| Champ | Description |
|-------|-------------|
| `semaine` | Numéro de semaine (0 = poussin à l'entrée) |
| `poids_initial` | Poids en grammes à la semaine 0 (utilisé comme base) |
| `gain_poids` | Gain de poids en grammes par semaine à partir de la semaine 1 |
| `nourrit_semaine` | Consommation de nourriture par poulet par semaine (en grammes) |

### Calcul du poids moyen à la semaine N

```
poids = poids_initial (semaine 0)
      + Σ gain_poids (semaines 1 à N)
```

Le calcul est effectué dans `lot.model.js` en Node.js, pas en SQL.

### Exemple

| Semaine | Poids (g) | Gain (g) | Nourrit/sem/poulet (g) |
|---------|-----------|----------|------------------------|
| 0 | 45 | — | 100 |
| 1 | — | 90 | 150 |
| 2 | — | 100 | 200 |
| 3 | — | 150 | 300 |

Poids à la semaine 2 = 45 + 90 + 100 = **235 g**

---

## 4. API

### Races

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/races` | Liste toutes les races |
| GET | `/api/races/:id` | Détail d'une race |
| POST | `/api/races` | Créer une race |
| PUT | `/api/races/:id` | Modifier une race |
| DELETE | `/api/races/:id` | Supprimer une race (bloqué si des lots utilisent cette race) |

### Croissance

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/croissance-race` | Tous les modèles |
| POST | `/api/croissance-race` | Ajouter une ligne de croissance |
| PUT | `/api/croissance-race/:id` | Modifier |
| DELETE | `/api/croissance-race/:id` | Supprimer |

---

## 5. Frontend

**Fichiers** : `features/races/`

- La page liste toutes les races dans un tableau
- Chaque race affiche le panel de croissance `CroissanceRace` dans une ligne extensible
- CRUD complet via `ModalComponent` partagé
- Service : `RaceService` (`core/services/race.service.ts`)

---

## 6. Contraintes métier

- Le `nom` d'une race doit être unique
- Une race ne peut pas être supprimée si des lots y sont rattachés
- `duree_incubation` est utilisé automatiquement lors de la création d'une incubation pour calculer `date_eclosion`
- `prix_oeuf` et `prix_vente_g` servent de valeurs par défaut préremplies dans les formulaires de vente
