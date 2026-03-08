# AviFarm — Incubations

> [← Index](PROJECT.md)

---

## 1. Fonctionnalité

La page **Incubations** (`/incubations`) gère le cycle complet de mise en incubation des oeufs : création, suivi du statut, et enregistrement de l'éclosion avec création automatique d'un nouveau lot.

---

## 2. Champs d'une incubation

| Champ | Description |
|-------|-------------|
| `oeuf_id` | Enregistrement de collecte source |
| `nombre_incubes` | Nombre d'oeufs mis en incubation |
| `date_debut` | Date de début |
| `date_eclosion` | Date d'éclosion prévue (calculée automatiquement) |
| `lot_issu_id` | Lot créé après éclosion (null tant que non éclos) |
| `statut` | `en_cours` / `eclos` / `echoue` |

---

## 3. Calcul de la date d'éclosion

```
date_eclosion = date_debut + race.duree_incubation (jours)
```

`duree_incubation` est récupéré depuis la race du lot parent via la chaîne :
`oeuf_id → Lot → Race.duree_incubation`

Ce calcul est fait **côté backend** dans `incubation.model.js` lors de la création.

---

## 4. Statuts

| Statut | Signification |
|--------|---------------|
| `en_cours` | Oeufs en incubation, éclosion non encore atteinte |
| `eclos` | Incubation terminée avec succès, nouveau lot créé |
| `echoue` | Incubation échouée (mauvaise température, maladie…) |

---

## 5. Workflow d'éclosion (`PUT /api/incubations/:id`)

Quand le statut est passé à `eclos` :

1. Le backend vérifie que l'incubation est en `en_cours`
2. Un nouveau lot est créé automatiquement :
   - `numero` : `Ecl-{numero_parent}-{YYMMDD}` (ex : `Ecl-Lot2-250417`)
   - `race_id` : identique au lot parent
   - `nombre_initial` : `nombre_incubes` de l'incubation
   - `date_entree` : date d'éclosion
   - `lot_parent_id` : `lot_id` du lot parent
   - `actif` : `1`
3. L'incubation est mise à jour avec `lot_issu_id` → nouvel ID, `statut` → `eclos`

Tout se passe dans une seule transaction SQL (création lot + mise à jour incubation atomiques).

---

## 6. Validation de stock d'oeufs

Avant de créer une incubation, le backend vérifie que le nombre d'oeufs disponibles est suffisant :

```
disponibles = nombre_oeufs (collecte)
            − Σ Incubation.nombre_incubes (autres incubations du même oeuf_id)
            − Σ VenteOeufs.nombre_vendus (ventes liées au même oeuf_id)
```

---

## 7. API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/incubations` | Toutes les incubations |
| GET | `/api/incubations/:id` | Détail |
| POST | `/api/incubations` | Créer une incubation |
| PUT | `/api/incubations/:id` | Modifier (dont passage en `eclos` → crée le lot) |
| DELETE | `/api/incubations/:id` | Supprimer (seulement si `en_cours` ou `echoue`) |

---

## 8. Frontend

**Fichiers** : `features/incubations/`

- Tableau avec colonnes : date début, date éclosion, lot source, nombre incubés, statut, lot issu
- Bouton **"Valider éclosion"** visible uniquement pour les incubations `en_cours` dont la date d'éclosion est dépassée
- Bouton **"Marquer comme échoué"** pour les incubations `en_cours`
- Modification générale via `ModalComponent`
- Service : `IncubationService` (`core/services/incubation.service.ts`)

---

## 9. Contraintes métier

- Une incubation `eclos` ou `echoue` ne peut plus être modifiée
- Le lot issu d'une éclosion ne peut pas être supprimé tant que l'incubation `eclos` existe
- Le `nombre_incubes` doit être ≥ 1 et ≤ stock disponible
