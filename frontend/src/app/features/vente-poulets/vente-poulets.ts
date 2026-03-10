import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { VentePouletsService } from '../../core/services/vente-poulets.service';
import { LotService } from '../../core/services/lot.service';
import { RaceService } from '../../core/services/race.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { VentePoulets, Lot, LotSituation, Race } from '../../core/models/models';

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
  situations: LotSituation[] = []; races: Race[] = [];
  loading = false; error = '';
  showModal = false; saving = false;
  editId: number | null = null; form: Partial<VentePoulets> = {};
  deleteId: number | null = null; showConfirm = false;

  saveError = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({
      items: this.svc.getAll(),
      lots: this.lotSvc.getAll(),
      situations: this.lotSvc.getSituation(),
      races: this.raceSvc.getAll(),
    }).subscribe({
      next: ({ items, lots, situations, races }) => {
        this.items = items; this.lots = lots;
        this.situations = situations; this.races = races;
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les ventes.'; this.loading = false; },
    });
  }

  lotNum(id: number) { return this.lots.find(l => l.lot_id === id)?.numero ?? id; }

  onLotChange(lotId: number | string) {
    const id = +lotId;
    const sit = this.situations.find(s => s.lot_id === id);
    if (sit) {
      this.form.poids_moyen_g = sit.poids_moyen_g ?? undefined;
    }
    const lot = this.lots.find(l => l.lot_id === id);
    if (lot) {
      const race = this.races.find(r => r.race_id === lot.race_id);
      if (race) { this.form.prix_vente_g = race.prix_vente_g; }
    }
  }
  computeTotal(v: Partial<VentePoulets>) { return (v.nombre_vendus ?? 0) * (v.poids_moyen_g ?? 0) * (v.prix_vente_g ?? 0); }

  openCreate() { this.editId = null; this.form = {}; this.saveError = ''; this.showModal = true; }
  openEdit(v: VentePoulets) { this.editId = v.vente_id!; this.form = { ...v }; this.saveError = ''; this.showModal = true; }

  save() {
    this.saving = true; this.saveError = '';
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
