import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { VentePouletsService } from '../../core/services/vente-poulets.service';
import { LotService } from '../../core/services/lot.service';
import { RaceService } from '../../core/services/race.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { VentePoulets, Lot, Race } from '../../core/models/models';

@Component({
  selector: 'app-vente-poulets',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './vente-poulets.html',
  styleUrl: './vente-poulets.scss',
})
export class VentePouletsComponent implements OnInit {
  private svc     = inject(VentePouletsService);
  private lotSvc  = inject(LotService);
  private raceSvc = inject(RaceService);

  items: VentePoulets[] = []; lots: Lot[] = [];
  races: Race[] = [];
  loading = false; error = '';
  showModal = false; saving = false;
  editId: number | null = null; form: Partial<VentePoulets> = {};
  deleteId: number | null = null; showConfirm = false;
  poidsLoading = false;
  saveError = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({
      items: this.svc.getAll(),
      lots: this.lotSvc.getAll(),
      races: this.raceSvc.getAll(),
    }).subscribe({
      next: ({ items, lots, races }) => {
        this.items = items; this.lots = lots;
        this.races = races;
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les ventes.'; this.loading = false; },
    });
  }

  lotNum(id: number) { return this.lots.find(l => l.lot_id === id)?.numero ?? id; }

  private recomputePoids() {
    const lotId = this.form.lot_id ? +this.form.lot_id : null;
    const date  = this.form.date_vente;
    if (!lotId || !date) return;
    this.poidsLoading = true;
    this.form.poids_moyen_g = undefined;
    this.form.prix_vente_g  = undefined;
    this.lotSvc.getPoidsAt(lotId, date).subscribe({
      next: ({ poids_moyen_g, prix_vente_g }) => {
        this.form.poids_moyen_g = poids_moyen_g;
        this.form.prix_vente_g  = prix_vente_g;
        this.poidsLoading = false;
      },
      error: () => { this.poidsLoading = false; },
    });
  }

  onLotChange(_: any) { this.recomputePoids(); }
  onDateChange()      { this.recomputePoids(); }

  computeTotal(v: Partial<VentePoulets>) { return (v.nombre_vendus ?? 0) * (v.poids_moyen_g ?? 0) * (v.prix_vente_g ?? 0); }

  openCreate() { this.editId = null; this.form = {}; this.saveError = ''; this.showModal = true; }
  openEdit(v: VentePoulets) { this.editId = v.vente_id!; this.form = { ...v }; this.saveError = ''; this.showModal = true; }

  save() {
    this.saveError = '';
    if (!this.form.lot_id) { this.saveError = 'Veuillez sélectionner un lot.'; return; }
    if (!this.form.date_vente) { this.saveError = 'La date de vente est obligatoire.'; return; }
    if (!(this.form.nombre_vendus! >= 1)) { this.saveError = 'Le nombre vendu doit être ≥ 1.'; return; }
    if (!(this.form.poids_moyen_g! > 0)) { this.saveError = 'Poids non calculé. Vérifiez le lot et la date.'; return; }
    if (!(this.form.prix_vente_g! > 0)) { this.saveError = 'Prix non disponible. Vérifiez la race du lot.'; return; }
    this.saving = true;
    const obs = this.editId ? this.svc.update(this.editId, this.form as VentePoulets) : this.svc.create(this.form as VentePoulets);
    obs.subscribe({
      next: () => { this.showModal = false; this.saving = false; this.load(); },
      error: (err) => { this.saving = false; this.saveError = err?.error?.error ?? 'Une erreur est survenue.'; },
    });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }
  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe(() => { this.showConfirm = false; this.deleteId = null; this.load(); });
  }
}
