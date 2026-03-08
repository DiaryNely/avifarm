export interface Race {
  race_id?: number;
  nom: string;
  prix_nourrit_g: number;
  prix_vente_g: number;
  prix_oeuf: number;
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
  semaine_actuelle: number;
  nombre_actuel: number;
  total_morts: number;
  total_vendus: number;
  taux_mortalite: number;
  revenu_vente_poulets_ar: number;
  poids_moyen_g: number;
  poids_total_g: number;
  valeur_poulets_ar: number;
  nourrit_total_g: number;
  cout_nourrit_ar: number;
  total_oeufs: number;
  revenu_oeufs_ar: number;
  cout_achat_ar: number;
  benefice_ar: number;
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
}

export interface Incubation {
  incubation_id?: number;
  oeuf_id: number;
  nombre_incubes: number;
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
}

export interface VenteOeufs {
  vente_id?: number;
  oeuf_id: number;
  nombre_vendus: number;
  prix_unitaire: number;
  date_vente: string;
  montant_total?: number;
}

export interface VentePoulets {
  vente_id?: number;
  lot_id: number;
  date_vente: string;
  nombre_vendus: number;
  poids_moyen_g: number;
  prix_vente_g: number;
  montant_total?: number;
}

export interface CoutAchat {
  achat_id?: number;
  lot_id: number;
  cout_total: number;
  date_achat: string;
  notes?: string;
}
