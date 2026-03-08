import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MortaliteService } from '../../core/services/mortalite.service';
import { LotService } from '../../core/services/lot.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { Mortalite, Lot, LotSituation } from '../../core/models/models';

@Component({
  selector: 'app-mortalites',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './mortalites.html',
  styleUrl: './mortalites.scss',
})
export class MortalitesComponent implements OnInit {
  private svc    = inject(MortaliteService);
  private lotSvc = inject(LotService);

  items: Mortalite[]     = [];
  lots: Lot[]            = [];
  situations: LotSituation[] = [];

  loading = false;
  error   = '';

  showModal = false;
  saving    = false;
  editId: number | null  = null;
  form: Partial<Mortalite> = {};
  formError = '';

  deleteId: number | null = null;
  showConfirm = false;

  // Filtre par lot
  filterLotId: number | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({
      items:      this.svc.getAll(),
      lots:       this.lotSvc.getAll(),
      situations: this.lotSvc.getSituation(),
    }).subscribe({
      next: ({ items, lots, situations }) => {
        this.items      = items;
        this.lots       = lots;
        this.situations = situations;
        this.loading    = false;
      },
      error: () => { this.error = 'Impossible de charger les données.'; this.loading = false; },
    });
  }

  get filteredItems(): Mortalite[] {
    if (!this.filterLotId) return this.items;
    return this.items.filter(m => m.lot_id === Number(this.filterLotId));
  }

  get totalMortsAffichés(): number {
    return this.filteredItems.reduce((s, m) => s + m.nombre_morts, 0);
  }

  get totalAlive(): number {
    return this.situations.reduce((s, sit) => s + sit.nombre_actuel, 0);
  }

  get totalMortsSituations(): number {
    return this.situations.reduce((s, sit) => s + sit.total_morts, 0);
  }

  get totalInitial(): number {
    return this.situations.reduce((s, sit) => s + sit.nombre_actuel + sit.total_morts + sit.total_vendus, 0);
  }

  situationFor(lotId: number): LotSituation | undefined {
    return this.situations.find(s => s.lot_id === lotId);
  }

  lotNum(id: number): string {
    return this.lots.find(l => l.lot_id === id)?.numero ?? String(id);
  }

  openCreate() {
    this.editId    = null;
    this.formError = '';
    this.form      = { nombre_morts: 1, lot_id: this.filterLotId ?? undefined };
    this.showModal = true;
  }

  openEdit(m: Mortalite) {
    this.editId    = m.mortalite_id!;
    this.formError = '';
    this.form      = { ...m };
    this.showModal = true;
  }

  save() {
    this.formError = '';
    this.saving = true;
    const obs = this.editId
      ? this.svc.update(this.editId, this.form as Mortalite)
      : this.svc.create(this.form as Mortalite);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.load(); },
      error: (err) => { this.formError = err.error?.error || 'Erreur serveur.'; this.saving = false; },
    });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }

  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe(() => {
      this.showConfirm = false; this.deleteId = null; this.load();
    });
  }
}
