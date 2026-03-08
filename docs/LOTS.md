# AviFarm — Lots

> [← Index](PROJECT.md)

---

## 1. Fonctionnalité

La page **Lots** (`/lots`) gère les groupes de poulets. Chaque lot regroupe un effectif d'une même race entré à une même date.

---

## 2. Champs d'un lot

| Champ | Description |
|-------|-------------|
| `numero` | Numéro lisible unique (ex : "Lot 1") |
| `race_id` | Race des poulets |
| `nombre_initial` | Effectif à l'entrée |
| `date_entree` | Date d'entrée dans l'élevage |
| `lot_parent_id` | Lot parent si le lot est issu d'une éclosion (nullable) |
| `actif` | `1` = lot en cours, `0` = lot fermé/vendu |

---

## 3. Calcul de la semaine actuelle

```
semaines = Math.floor( (Date.now() - date_entree) / (7 × 24 × 3600 × 1000) )
```

Calculé en Node.js dans `lot.model.js`.

---

## 4. Situation d'un lot (`GET /api/lots/situation`)

### Indicateurs retournés

| Indicateur | Formule / Source |
|------------|-----------------|
| `semaine_actuelle` | `floor((maintenant − date_entree) / 7j)` |
| `nombre_actuel` | `nombre_initial − total_morts − total_vendus` |
| `poids_moyen_g` | `poids_initial + Σ gain_poids (sem. 1..N)` |
| `poids_total_g` | `poids_moyen_g × nombre_actuel` |
| `nourrit_total_g` | `Σ nourrit_semaine (sem. 0..N) × nombre_actuel` |
| `cout_nourrit_ar` | `nourrit_total_g × prix_nourrit_g` |
| `cout_achat_ar` | `CoutAchat.cout_total` pour ce lot |
| `revenu_vente_poulets_ar` | `Σ VentePoulets.montant_total` du lot |
| `revenu_oeufs_ar` | `Σ VenteOeufs.montant_total` du lot |
| `actif` | `lot.actif` (BIT) |

### Formule du bénéfice

```
benefice_ar = revenu_vente_poulets_ar + revenu_oeufs_ar
            − cout_nourrit_ar − cout_achat_ar
```

> **Important** : la valeur estimée des poulets restants (`valeurPoulets`) **n'est pas incluse** dans le bénéfice. Seuls les revenus réalisés (ventes effectives) entrent dans le calcul.

### Implémentation

`buildSituation()` dans `backend/models/lot.model.js` effectue 6 requêtes parallèles via `Promise.all` :
1. Données du lot + race
2. Total morts (`Mortalite`)
3. Total vendus (`VentePoulets`)
4. Données de croissance (`CroissanceRace`)
5. Revenus oeufs (`VenteOeufs`)
6. Coût d'achat (`CoutAchat`)

---

## 5. Interface TypeScript `LotSituation`

```typescript
export interface LotSituation {
  lot_id: number;
  numero: string;
  race_id: number;
  race_nom: string;
  nombre_initial: number;
  date_entree: string;
  actif: number;           // 1 = actif, 0 = fermé
  semaine_actuelle: number;
  nombre_actuel: number;
  poids_moyen_g: number;
  poids_total_g: number;
  nourrit_total_g: number;
  cout_nourrit_ar: number;
  cout_achat_ar: number;
  revenu_vente_poulets_ar: number;
  revenu_oeufs_ar: number;
  benefice_ar: number;
}
```

---

## 6. API

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/lots` | Liste tous les lots |
| GET | `/api/lots/situation` | Situation calculée de tous les lots |
| GET | `/api/lots/:id` | Détail d'un lot |
| GET | `/api/lots/:id/situation` | Situation d'un lot spécifique |
| POST | `/api/lots` | Créer un lot |
| PUT | `/api/lots/:id` | Modifier un lot |
| DELETE | `/api/lots/:id` | Supprimer un lot |

---

## 7. Frontend

**Fichiers** : `features/lots/`

- Tableau listant tous les lots avec race, effectif initial, date d'entrée, statut actif/fermé
- CRUD via `ModalComponent`
- Service : `LotService` (`core/services/lot.service.ts`) — expose notamment `getSituation()`

### Suppression du panneau situation

> Le panneau "Situation d'un lot" a été **retiré de la page lots** et déplacé sur le **dashboard** sous forme de section inline avec sélecteur de lot et cartes KPI. Voir [DASHBOARD.md](DASHBOARD.md).

---

## 8. Contraintes métier

- Le `numero` d'un lot doit être unique
- Un lot issu d'une incubation (`lot_parent_id` non null) est créé automatiquement via l'éclosion — voir [INCUBATIONS.md](INCUBATIONS.md)
- Le champ `actif` permet de distinguer les lots en cours des lots terminés sans les supprimer
