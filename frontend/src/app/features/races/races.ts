import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RaceService } from '../../core/services/race.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { Race } from '../../core/models/models';

@Component({
  selector: 'app-races',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './races.html',
  styleUrl: './races.scss',
})
export class RacesComponent implements OnInit {
  private svc = inject(RaceService);

  races: Race[] = [];
  loading = false;
  error = '';
  showModal = false;
  saving = false;
  editId: number | null = null;
  form: Partial<Race> = {};
  saveError = '';
  deleteId: number | null = null;
  showConfirm = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.svc.getAll().subscribe({
      next: d => { this.races = d; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les races.'; this.loading = false; },
    });
  }

  openCreate() { this.editId = null; this.form = {}; this.saveError = ''; this.showModal = true; }
  openEdit(r: Race) { this.editId = r.race_id!; this.form = { ...r }; this.saveError = ''; this.showModal = true; }

  save() {
    this.saveError = '';
    if (!this.form.nom?.trim()) { this.saveError = 'Le nom est obligatoire.'; return; }
    if (!(this.form.prix_nourrit_g! > 0)) { this.saveError = 'Le prix de nourriture doit être > 0.'; return; }
    if (!(this.form.prix_vente_g! > 0)) { this.saveError = 'Le prix de vente doit être > 0.'; return; }
    if (!(this.form.prix_oeuf! > 0)) { this.saveError = 'Le prix de l\'oeuf doit être > 0.'; return; }
    if (!(this.form.semaine_ponte! >= 1)) { this.saveError = 'La semaine de ponte doit être ≥ 1.'; return; }
    if (!(this.form.duree_incubation! >= 1)) { this.saveError = 'La durée d\'incubation doit être ≥ 1 jour.'; return; }
    this.saving = true;
    const obs = this.editId
      ? this.svc.update(this.editId, this.form as Race)
      : this.svc.create(this.form as Race);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.load(); },
      error: (err) => { this.saving = false; this.saveError = err?.error?.error ?? 'Erreur lors de l\'enregistrement.'; },
    });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }
  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe(() => { this.showConfirm = false; this.deleteId = null; this.load(); });
  }
}
