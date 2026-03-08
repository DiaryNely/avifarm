# AviFarm — Ventes

> [← Index](PROJECT.md)

---

## 1. Deux types de ventes

| Page | URL | Objet vendu |
|------|-----|-------------|
| Vente Oeufs | `/vente-oeufs` | Oeufs collectés |
| Vente Poulets | `/vente-poulets` | Poulets vivants d'un lot |

---

## 2. Vente d'oeufs

### Champs

| Champ | Description |
|-------|-------------|
| `oeuf_id` | Enregistrement de collecte source |
| `nombre_vendus` | Quantité vendue |
| `prix_unitaire` | Prix par oeuf en Ar (prérempli depuis `race.prix_oeuf`) |
| `date_vente` | Date de la vente |
| `montant_total` | COMPUTED : `nombre_vendus × prix_unitaire` |

### Validation de stock

Avant d'enregistrer, le backend vérifie :
```
disponibles = nombre_oeufs − Σ Incubation.nombre_incubes − Σ VenteOeufs.nombre_vendus
```

### API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/vente-oeufs` | Toutes les ventes |
| GET | `/api/vente-oeufs/:id` | Détail |
| POST | `/api/vente-oeufs` | Créer une vente |
| PUT | `/api/vente-oeufs/:id` | Modifier |
| DELETE | `/api/vente-oeufs/:id` | Supprimer |

---

## 3. Vente de poulets

### Champs

| Champ | Description |
|-------|-------------|
| `lot_id` | Lot vendu |
| `date_vente` | Date de la vente |
| `nombre_vendus` | Nombre de poulets vendus |
| `poids_moyen_g` | Poids moyen au moment de la vente (en g) |
| `prix_vente_g` | Prix par gramme (prérempli depuis `race.prix_vente_g`) |
| `montant_total` | COMPUTED : `nombre_vendus × poids_moyen_g × prix_vente_g` |

### Validation de stock (backend)

Avant de créer ou modifier une vente poulets, le backend vérifie le stock disponible via **sous-requêtes corrélées** dans `ventePoulets.model.js` :

```sql
SELECT
  l.nombre_initial
  - ISNULL((SELECT SUM(m.nombre_morts) FROM Mortalite m WHERE m.lot_id = l.lot_id), 0)
  - ISNULL((SELECT SUM(vp.nombre_vendus) FROM VentePoulets vp
            WHERE vp.lot_id = l.lot_id
            -- AND vp.vente_id <> @venteId  (exclut l'enregistrement en cours si update)
           ), 0)
  AS nombre_actuel
FROM Lot l
WHERE l.lot_id = @lotId
```

> **Correction apportée** : l'ancienne implémentation utilisait `LEFT JOIN VentePoulets + SUM() + GROUP BY l.nombre_initial`, ce qui produisait des résultats incorrects avec plusieurs enregistrements de vente. Remplacé par des sous-requêtes corrélées (identique au fix de `mortalite.model.js`).

### Affichage des erreurs backend (frontend)

En cas d'erreur (stock insuffisant, lot inexistant…), le backend retourne HTTP 400 avec le message dans `error.error`.

Le composant `VentePouletsComponent` capture et affiche ce message dans le formulaire modal :

```typescript
// vente-poulets.ts
saveError = '';

save() {
  // ...
  error: (err) => {
    this.saving = false;
    this.saveError = err?.error?.error ?? 'Une erreur est survenue.';
  }
}
```

```html
<!-- vente-poulets.html (dans la modale) -->
@if (saveError) {
  <div class="error-msg">{{ saveError }}</div>
}
```

L'erreur est réinitialisée à chaque ouverture du formulaire (`openCreate()` / `openEdit()`).

### API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/vente-poulets` | Toutes les ventes |
| GET | `/api/vente-poulets/lot/:lotId` | Ventes d'un lot |
| GET | `/api/vente-poulets/:id` | Détail |
| POST | `/api/vente-poulets` | Créer une vente |
| PUT | `/api/vente-poulets/:id` | Modifier |
| DELETE | `/api/vente-poulets/:id` | Supprimer |

---

## 4. Frontend

**Fichiers** : `features/vente-oeufs/`, `features/vente-poulets/`

- Tableaux filtrables par lot
- CRUD via `ModalComponent`
- Services : `VenteOeufsService`, `VentePouletsService`
- Les formulaires pré-remplissent `prix_unitaire` / `prix_vente_g` depuis la race du lot sélectionné

---

## 5. Contraintes métier

- `nombre_vendus` ≥ 1
- Le cumul des ventes (+ mortalités pour les poulets) ne peut pas dépasser le stock disponible
- Le total vendu est utilisé dans le calcul de la situation financière du lot (`benefice_ar`)
