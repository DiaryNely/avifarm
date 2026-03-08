# AviFarm — Mortalités

> [← Index](PROJECT.md)

---

## 1. Fonctionnalité

La page **Mortalités** (`/mortalites`) permet d'enregistrer les décès de poulets dans un lot, avec date, nombre et cause optionnelle.

---

## 2. Champs

| Champ | Description |
|-------|-------------|
| `lot_id` | Lot concerné |
| `date_mort` | Date du décès |
| `nombre_morts` | Nombre de morts (≥ 1) |
| `cause` | Cause optionnelle (maladie, accident…) |

---

## 3. Validation de stock (backend)

Avant d'enregistrer ou modifier une mortalité, le backend vérifie que le nombre de morts n'excède pas le stock disponible.

### Stock disponible (nombre_actuel)

```
nombre_actuel = nombre_initial
  − Σ Mortalite.nombre_morts (hors enregistrement en cours de modification)
  − Σ VentePoulets.nombre_vendus
```

### Implémentation — sous-requêtes corrélées

La validation utilise deux **sous-requêtes corrélées** dans `mortalite.model.js` (méthodes `create` et `update`) :

```sql
SELECT
  l.nombre_initial
  - ISNULL((SELECT SUM(m.nombre_morts) FROM Mortalite m WHERE m.lot_id = l.lot_id), 0)
  - ISNULL((SELECT SUM(vp.nombre_vendus) FROM VentePoulets vp WHERE vp.lot_id = l.lot_id), 0)
  AS nombre_actuel
FROM Lot l
WHERE l.lot_id = @lotId
```

> **Correction apportée** : l'ancienne implémentation utilisait un `LEFT JOIN Mortalite + SUM() + GROUP BY l.nombre_initial`, ce qui produisait des résultats incorrects quand un lot avait plusieurs enregistrements de mortalité. Remplacé par des sous-requêtes corrélées.

Pour `update`, la sous-requête exclut la mortalité en cours de modification :
```sql
- ISNULL((SELECT SUM(m.nombre_morts) FROM Mortalite m
          WHERE m.lot_id = l.lot_id AND m.mortalite_id <> @mortaliteId), 0)
```

---

## 4. API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/mortalites` | Toutes les mortalités |
| GET | `/api/mortalites/lot/:lotId` | Mortalités d'un lot |
| GET | `/api/mortalites/:id` | Détail |
| POST | `/api/mortalites` | Enregistrer une mortalité |
| PUT | `/api/mortalites/:id` | Modifier |
| DELETE | `/api/mortalites/:id` | Supprimer |

---

## 5. Frontend

**Fichiers** : `features/mortalites/`

- Tableau filtrable par lot
- CRUD via `ModalComponent`
- Service : `MortaliteService` (`core/services/mortalite.service.ts`)

---

## 6. Contraintes métier

- `nombre_morts` ≥ 1
- Le cumul des mortalités + ventes ne peut pas dépasser `nombre_initial` du lot
- En cas de dépassement, le backend retourne une erreur HTTP 400 avec message explicatif
