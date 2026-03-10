import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RaceService } from '../../core/services/race.service';
import { CroissanceRaceService } from '../../core/services/croissance-race.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { Race, CroissanceRace, CroissanceRaceTableau } from '../../core/models/models';

@Component({
  selector: 'app-croissance-race',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './croissance-race.html',
  styleUrl: './croissance-race.scss',
})
export class CroissanceRaceComponent implements OnInit {
  private raceSvc = inject(RaceService);
  private svc     = inject(CroissanceRaceService);

  races: Race[] = [];
  selectedRaceId: number | null = null;
  filterWeek: number | null = null;

  tableau: CroissanceRaceTableau[] = [];
  filteredTableau: CroissanceRaceTableau[] = [];

  loading = false;
  error   = '';

  showModal  = false;
  editId: number | null = null;
  form: Partial<CroissanceRace> = {};
  saving     = false;
  saveError  = '';

  showConfirm = false;
  deleteId: number | null = null;

  ngOnInit() {
    this.raceSvc.getAll().subscribe({
      next: races => { this.races = races; },
      error: () => { this.error = 'Impossible de charger les races.'; },
    });
  }

  onRaceChange() {
    this.filterWeek = null;
    if (this.selectedRaceId) {
      this.loadTableau();
    } else {
      this.tableau = [];
      this.filteredTableau = [];
    }
  }

  loadTableau() {
    if (!this.selectedRaceId) return;
    this.loading = true;
    this.error   = '';
    this.svc.getTableau(this.selectedRaceId).subscribe({
      next: data => { this.tableau = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'Impossible de charger le tableau de croissance.'; this.loading = false; },
    });
  }

  applyFilter() {
    if (this.filterWeek !== null && this.filterWeek >= 0) {
      this.filteredTableau = this.tableau.filter(r => r.semaine <= this.filterWeek!);
    } else {
      this.filteredTableau = [...this.tableau];
    }
  }

  get selectedRace(): Race | undefined {
    return this.races.find(r => r.race_id === Number(this.selectedRaceId));
  }

  get isSemaine0(): boolean {
    return Number(this.form.semaine) === 0;
  }

  openCreate() {
    this.editId = null;
    this.saveError = '';
    this.form   = { race_id: this.selectedRaceId ?? undefined, semaine: undefined };
    this.showModal = true;
  }

  openEdit(r: CroissanceRaceTableau) {
    this.editId = r.croissance_id!;
    this.saveError = '';
    this.form   = {
      race_id:         r.race_id,
      semaine:         r.semaine,
      poids_initial:   r.poids_initial,
      gain_poids:      r.gain_poids,
      nourrit_semaine: r.nourrit_semaine,
    };
    this.showModal = true;
  }

  save() {
    this.saveError = '';
    if (!this.form.race_id) { this.saveError = 'Veuillez sélectionner une race.'; return; }
    if (this.form.semaine === undefined || this.form.semaine === null || this.form.semaine < 0) { this.saveError = 'Le numéro de semaine doit être ≥ 0.'; return; }
    if (this.isSemaine0 && !(this.form.poids_initial! > 0)) { this.saveError = 'Le poids initial doit être > 0.'; return; }
    if (!this.isSemaine0 && !(this.form.gain_poids! > 0)) { this.saveError = 'Le gain de poids doit être > 0.'; return; }
    if (!(this.form.nourrit_semaine! >= 0)) { this.saveError = 'La nourriture par semaine est obligatoire.'; return; }
    this.saving = true;
    // Semaine 0 → gain_poids null ; sinon → poids_initial null
    const payload: CroissanceRace = {
      race_id:         Number(this.form.race_id),
      semaine:         Number(this.form.semaine),
      poids_initial:   this.isSemaine0 ? (this.form.poids_initial ?? null) : null,
      gain_poids:      !this.isSemaine0 ? (this.form.gain_poids ?? null) : null,
      nourrit_semaine: Number(this.form.nourrit_semaine),
    };
    const obs = this.editId
      ? this.svc.update(this.editId, payload)
      : this.svc.create(payload);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.loadTableau(); },
      error: (err: any) => { this.saving = false; this.saveError = err?.error?.error ?? 'Erreur lors de l\'enregistrement.'; },
    });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }

  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe(() => {
      this.showConfirm = false;
      this.deleteId    = null;
      this.loadTableau();
    });
  }
}
