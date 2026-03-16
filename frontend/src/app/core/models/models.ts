export interface Race {
  race_id?: number;
  nom: string;
  prix_nourrit_g: number;
  prix_vente_g: number;
  prix_oeuf: number;
  capacite_ponte_max: number;
  semaine_ponte: number;
  duree_incubation: number;
  date_creation?: string;
}

export interface CroissanceRace {
  croissance_id?: number;
  race_id: number;
  semaine: number;
  poids_initial?: number | null;
  gain_poids?: number | null;
  nourrit_semaine: number;
}

export interface CroissanceRaceTableau extends CroissanceRace {
  poids_actuel: number;
  nourrit_cumul: number;
  prix_nourrit_g: number;
  cout_nourrit_semaine: number;
  cout_nourrit_cumul: number;
}

export interface Lot {
  lot_id?: number;
  numero: string;
  race_id: number;
  nombre_initial: number;
  date_entree: string;
  lot_parent_id?: number | null;
  actif?: boolean | number;
  date_creation?: string;
}

export interface LotSituation {
  lot_id: number;
  numero: string;
  race: string;
  date_entree: string;
  actif: number;
  jour_actuel: number;
  semaine_actuelle: number;
  nombre_actuel: number;
  total_morts: number;
  taux_mortalite: number;
  poids_moyen_g: number;
  poids_total_g: number;
  valeur_poulets_ar: number;
  nourrit_total_g: number;
  cout_nourrit_ar: number;
  nourrit_jour_g: number;
  cout_nourrit_jour_ar: number;
  total_oeufs: number;
  valeur_oeufs_ar: number;
  cout_achat_ar: number;
  valeur_estimee_totale_ar: number;
  benefice_estime_ar: number;
}

export interface Mortalite {
  mortalite_id?: number;
  lot_id: number;
  date_mort: string;
  nombre_morts: number;
  cause?: string;
}

export interface EnregistrementOeufs {
  oeuf_id?: number;
  lot_id: number;
  date_collecte: string;
  nombre_oeufs: number;
  taux_perte_pct?: number;
}

export interface Incubation {
  incubation_id?: number;
  oeuf_id: number;
  nombre_incubes: number;
  taux_perte_pct?: number;
  date_debut: string;
  date_eclosion: string;
  lot_issu_id?: number | null;
  statut: 'en_cours' | 'eclos' | 'echoue';
}

export interface IncubationDetail extends Incubation {
  lot_id: number;
  lot_numero: string;
  race_nom: string;
  duree_incubation: number;
  date_collecte: string;
  nombre_oeufs: number;
  lot_issu_numero?: string | null;
  nombre_non_eclos?: number | null;
}

export interface CoutAchat {
  achat_id?: number;
  lot_id: number;
  cout_total: number;
  date_achat: string;
  notes?: string;
}
