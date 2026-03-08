# AviFarm — Dashboard

> [← Index](PROJECT.md)

---

## 1. Vue d'ensemble

Le **dashboard** (`/dashboard`) est la page d'accueil de l'application. Il présente sur une seule page :

1. **Statistiques globales** — 5 cartes de compteurs rapides
2. **Accès rapide** — raccourcis vers les pages principales
3. **Situation d'un lot** — sélecteur de lot + groupes de KPI détaillés
4. **Stats par lots** — tableau récapitulatif cliquable de tous les lots

---

## 2. Section 1 — Statistiques globales

5 cartes affichant des compteurs globaux chargés via `forkJoin` au démarrage :

| Carte | Source |
|-------|--------|
| Nombre de races | `GET /api/races` → `.length` |
| Nombre total de lots | `GET /api/lots` → `.length` |
| Lots actifs | `GET /api/lots` → filtre `actif === 1` |
| Enregistrements mortalités | `GET /api/mortalites` → `.length` |
| Collectes d'oeufs | `GET /api/oeufs` → `.length` |

---

## 3. Section 2 — Accès rapide

Grille de liens rapides (cards cliquables) vers les pages de l'application :

- Lots, Races, Mortalités, Oeufs, Incubations, Vente Oeufs, Vente Poulets, Coûts d'achat

---

## 4. Section 3 — Situation d'un lot

### Sélecteur de lot

- `<select>` déroulant listant tous les lots (numéro + race)
- Sélection automatique du premier lot au chargement
- Les KPI se mettent à jour immédiatement à chaque changement de sélection

### Tags informationnels

À côté du sélecteur, affichage de tags pour le lot sélectionné :
- Date d'entrée
- Semaine actuelle
- Statut : **Actif** (vert) ou **Fermé** (rouge) selon `actif === 1`

### Groupes de KPI

Les KPI sont regroupés en 5 catégories, chacune avec un en-tête coloré :

| Groupe | Indicateurs |
|--------|-------------|
| **Élevage** | Effectif initial, Effectif actuel, Total morts |
| **Poids** | Semaine actuelle, Poids moyen (g), Poids total (kg) |
| **Alimentation** | Nourriture totale consommée (kg), Coût nourriture (Ar) |
| **Revenus** | Revenu vente poulets (Ar), Revenu oeufs (Ar), Coût achat (Ar) |
| **Bilan** | Bénéfice (Ar) — coloré en vert si positif, rouge si négatif |

### Formule du bénéfice affichée

```
Bénéfice = Revenu vente poulets + Revenu oeufs − Coût nourriture − Coût achat
```

> Uniquement les revenus réalisés (ventes effectives). La valeur estimée des poulets vivants restants n'est pas incluse.

---

## 5. Section 4 — Stats par lots

Tableau récapitulatif de tous les lots avec :

| Colonne | Description |
|---------|-------------|
| Lot | Numéro du lot |
| Race | Nom de la race |
| Actif | Oui / Non |
| Semaine | Semaine actuelle |
| Effectif actuel | Nombre de poulets vivants |
| Coût nourriture | En Ar |
| Revenu poulets | En Ar |
| Revenu oeufs | En Ar |
| Bénéfice | En Ar, coloré vert/rouge |

**Interaction** : cliquer sur une ligne met à jour la section "Situation d'un lot" (le sélecteur se synchronise sur le lot cliqué). La ligne sélectionnée est mise en évidence.

---

## 6. Implémentation TypeScript

```typescript
// dashboard.ts
situations: LotSituation[] = [];
selectedLotId: number | null = null;

get selectedSit(): LotSituation | undefined {
  return this.situations.find(s => s.lot_id === this.selectedLotId);
}

// chargement via forkJoin
forkJoin({
  races: this.raceSvc.getAll(),
  lots: this.lotSvc.getAll(),
  mortalites: this.mortaliteSvc.getAll(),
  oeufs: this.oeufsSvc.getAll(),
  situations: this.lotSvc.getSituation(),
}).subscribe(data => {
  // ... mise à jour des compteurs
  this.situations = data.situations;
  if (this.situations.length) this.selectedLotId = this.situations[0].lot_id;
});
```

Imports nécessaires : `FormsModule` (pour le `[(ngModel)]` du sélecteur), `LotSituation` (depuis `models.ts`).

---

## 7. Styles (dashboard.scss)

Architecture CSS en blocs :

| Classe | Rôle |
|--------|------|
| `.stat-cards` | Grille des 5 compteurs globaux |
| `.section-title` | En-tête de section avec icône et ligne de bas |
| `.quick-grid` | Grille des accès rapides |
| `.sit-filter-bar` | Card contenant le sélecteur + tags |
| `.sit-kpi-grid` | Grille des groupes KPI |
| `.kpi-group` | Conteneur d'un groupe de KPI |
| `.kpi-card` | Carte individuelle d'un indicateur |
| `.lots-stat-table` | Tableau stats par lots, avec `.row-selected` et `.benef-cell` |

Variantes de couleur disponibles sur `.kpi-group` : `elevage`, `poids`, `alim`, `revenus`, `bilan`.

---

## 8. Source des données

`LotService.getSituation()` → `GET /api/lots/situation`

Voir [LOTS.md](LOTS.md) pour le détail du calcul côté backend.
