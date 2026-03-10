import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { OeufsService } from '../../core/services/oeufs.service';
import { LotService } from '../../core/services/lot.service';
import { IncubationService } from '../../core/services/incubation.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { EnregistrementOeufs, Lot, IncubationDetail } from '../../core/models/models';

@Component({
  selector: 'app-oeufs',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './oeufs.html',
  styleUrl: './oeufs.scss',
})
export class OeufsComponent implements OnInit {
  private svc    = inject(OeufsService);
  private lotSvc = inject(LotService);
  private incSvc = inject(IncubationService);

  items: EnregistrementOeufs[] = []; lots: Lot[] = [];
  incubations: IncubationDetail[] = [];
  loading = false; error = '';
  showModal = false; saving = false;
  editId: number | null = null; form: Partial<EnregistrementOeufs> = {};
  deleteId: number | null = null; showConfirm = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({ items: this.svc.getAll(), lots: this.lotSvc.getAll(), incubations: this.incSvc.getAll() }).subscribe({
      next: ({ items, lots, incubations }) => { this.items = items; this.lots = lots; this.incubations = incubations; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les enregistrements.'; this.loading = false; },
    });
  }

  lotNum(id: number) { return this.lots.find(l => l.lot_id === id)?.numero ?? id; }

  /** Nombre total d'oeufs mis en incubation pour un enregistrement donné */
  totalIncubes(oeufId: number): number {
    return this.incubations
      .filter(i => i.oeuf_id === oeufId)
      .reduce((s, i) => s + i.nombre_incubes, 0);
  }

  saveError = '';

  openCreate() { this.editId = null; this.form = {}; this.saveError = ''; this.showModal = true; }
  openEdit(o: EnregistrementOeufs) { this.editId = o.oeuf_id!; this.form = { ...o }; this.saveError = ''; this.showModal = true; }

  save() {
    this.saveError = '';
    if (!this.form.lot_id) { this.saveError = 'Veuillez sélectionner un lot.'; return; }
    if (!this.form.date_collecte) { this.saveError = 'La date de collecte est obligatoire.'; return; }
    if (!(this.form.nombre_oeufs! >= 1)) { this.saveError = 'Le nombre d\'oeufs doit être ≥ 1.'; return; }
    this.saving = true;
    const obs = this.editId ? this.svc.update(this.editId, this.form as EnregistrementOeufs) : this.svc.create(this.form as EnregistrementOeufs);
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
