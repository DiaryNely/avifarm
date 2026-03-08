import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { IncubationService } from '../../core/services/incubation.service';
import { OeufsService } from '../../core/services/oeufs.service';
import { LotService } from '../../core/services/lot.service';
import { RaceService } from '../../core/services/race.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { IncubationDetail, EnregistrementOeufs, Lot, Race } from '../../core/models/models';

@Component({
  selector: 'app-incubations',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './incubations.html',
  styleUrl: './incubations.scss',
})
export class IncubationsComponent implements OnInit {
  private svc     = inject(IncubationService);
  private oeufSvc = inject(OeufsService);
  private lotSvc  = inject(LotService);
  private raceSvc = inject(RaceService);

  items: IncubationDetail[]       = [];
  lots:  Lot[]                    = [];
  races: Race[]                   = [];
  oeufs: EnregistrementOeufs[]    = [];
  loading = false; error = '';

  // --- Modal création ---
  showModal = false; saving = false; formError = '';
  formLotId: number | null = null;
  form = { oeuf_id: null as number | null, nombre_incubes: null as number | null, date_debut: '' };
  dateEclosionPreview = '';

  // --- Modal éclosion ---
  showEclosionModal = false; eclosionSaving = false; eclosionError = '';
  eclosionId: number | null = null;
  eclosionItem: IncubationDetail | null = null;
  eclosionForm = { nombre_eclos: null as number | null };

  // --- Suppression ---
  deleteId: number | null = null; showConfirm = false;

  get filteredOeufs(): EnregistrementOeufs[] {
    if (!this.formLotId) return [];
    return this.oeufs.filter(o => o.lot_id === +this.formLotId!);
  }

  get selectedOeuf(): EnregistrementOeufs | null {
    return this.oeufs.find(o => o.oeuf_id === this.form.oeuf_id) ?? null;
  }

  get selectedLot(): Lot | null {
    return this.lots.find(l => l.lot_id === +this.formLotId!) ?? null;
  }

  get selectedRace(): Race | null {
    const lot = this.selectedLot;
    if (!lot) return null;
    return this.races.find(r => r.race_id === lot.race_id) ?? null;
  }

  /** Total oeufs disponibles (somme des enregistrements du lot) */
  get totalOeufsLot(): number {
    return this.filteredOeufs.reduce((s, o) => s + (o.nombre_oeufs ?? 0), 0);
  }

  /** Oeufs déjà mis en incubation en cours pour ce lot */
  get oeufsDejaIncubes(): number {
    if (!this.formLotId) return 0;
    return this.items
      .filter(i => i.lot_id === +this.formLotId! && i.statut === 'en_cours')
      .reduce((s, i) => s + i.nombre_incubes, 0);
  }

  /** Erreur inline sur le nombre à incuber */
  get nombreIncubesError(): string | null {
    const max = this.selectedOeuf?.nombre_oeufs ?? 0;
    const val = this.form.nombre_incubes;
    if (val === null || val === undefined) return null;
    if ((val as number) < 1)  return 'Le nombre doit être ≥ 1.';
    if ((val as number) > max) return `Dépassement : seulement ${max} oeuf(s) disponibles dans cet enregistrement.`;
    return null;
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({
      items: this.svc.getAll(),
      oeufs: this.oeufSvc.getAll(),
      lots:  this.lotSvc.getAll(),
      races: this.raceSvc.getAll(),
    }).subscribe({
      next: ({ items, oeufs, lots, races }) => {
        this.items = items; this.oeufs = oeufs; this.lots = lots; this.races = races;
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les données.'; this.loading = false; },
    });
  }

  onLotChange() {
    this.form.oeuf_id = null;
    this.computeEclosionPreview();
  }

  computeEclosionPreview() {
    const race = this.selectedRace;
    if (!this.form.date_debut || !race) { this.dateEclosionPreview = ''; return; }
    const d = new Date(this.form.date_debut);
    d.setDate(d.getDate() + race.duree_incubation);
    this.dateEclosionPreview = d.toISOString().split('T')[0];
  }

  statutLabel(s: string) { return s === 'eclos' ? 'Éclos' : s === 'echoue' ? 'Échoué' : 'En cours'; }
  statutClass(s: string) { return s === 'eclos' ? 'badge-success' : s === 'echoue' ? 'badge-danger' : 'badge-info'; }

  openCreate() {
    this.formLotId = null;
    this.form = { oeuf_id: null, nombre_incubes: null, date_debut: new Date().toISOString().split('T')[0] };
    this.dateEclosionPreview = ''; this.formError = '';
    this.showModal = true;
  }

  save() {
    // Validation visible
    if (!this.form.oeuf_id) {
      this.formError = 'Veuillez choisir un enregistrement d\'oeufs.';
      return;
    }
    const nb = Number(this.form.nombre_incubes);
    if (!nb || nb < 1) {
      this.formError = 'Veuillez indiquer un nombre d\'oeufs à incuber (≥ 1).';
      return;
    }
    const max = this.selectedOeuf?.nombre_oeufs ?? 0;
    if (nb > max) {
      this.formError = `Impossible : seulement ${max} oeuf(s) disponibles dans cet enregistrement.`;
      return;
    }
    if (!this.form.date_debut) {
      this.formError = 'Veuillez indiquer la date de début.';
      return;
    }
    this.saving = true; this.formError = '';
    this.svc.create({ oeuf_id: this.form.oeuf_id, nombre_incubes: nb, date_debut: this.form.date_debut }).subscribe({
      next: () => { this.showModal = false; this.saving = false; this.load(); },
      error: err => { this.saving = false; this.formError = err.error?.error ?? 'Erreur lors de l\'enregistrement'; },
    });
  }

  openEclosion(i: IncubationDetail) {
    this.eclosionId   = i.incubation_id!;
    this.eclosionItem = i;
    this.eclosionForm = { nombre_eclos: i.nombre_incubes };
    this.eclosionError = ''; this.showEclosionModal = true;
  }

  saveEclosion() {
    if (!this.eclosionId || !this.eclosionForm.nombre_eclos) return;
    this.eclosionSaving = true; this.eclosionError = '';
    this.svc.enregistrerEclosion(this.eclosionId, { nombre_eclos: this.eclosionForm.nombre_eclos }).subscribe({
      next: () => { this.showEclosionModal = false; this.eclosionSaving = false; this.load(); },
      error: err => { this.eclosionSaving = false; this.eclosionError = err.error?.error ?? 'Erreur lors de l\'enregistrement de l\'\u00e9closion'; },
    });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }
  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe({
      next: () => { this.showConfirm = false; this.deleteId = null; this.load(); },
      error: err => { this.error = err.error?.error ?? 'Erreur lors de la suppression'; this.showConfirm = false; },
    });
  }
}
