import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LotService } from '../../core/services/lot.service';
import { RaceService } from '../../core/services/race.service';
import { CroissanceRaceService } from '../../core/services/croissance-race.service';
import { ModalComponent } from '../../shared/components/modal/modal';
import { Lot, Race, LotSituation, CroissanceRaceTableau } from '../../core/models/models';

@Component({
  selector: 'app-lots',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './lots.html',
  styleUrl: './lots.scss',
})
export class LotsComponent implements OnInit {
  private svc          = inject(LotService);
  private raceSvc      = inject(RaceService);
  private croissanceSvc = inject(CroissanceRaceService);

  lots: Lot[] = [];
  races: Race[] = [];
  situations: LotSituation[] = [];
  loading = false; error = '';
  showModal = false; saving = false;
  editId: number | null = null;
  form: Partial<Lot> = {};
  deleteId: number | null = null; showConfirm = false;

  // Panneau croissance
  showCroissance = false;
  croissanceLot: Lot | null = null;
  croissanceTableau: CroissanceRaceTableau[] = [];
  croissanceLoading = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    forkJoin({ lots: this.svc.getAll(), races: this.raceSvc.getAll(), situations: this.svc.getSituation() }).subscribe({
      next: ({ lots, races, situations }) => { this.lots = lots; this.races = races; this.situations = situations; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les lots.'; this.loading = false; },
    });
  }

  raceName(id: number) { return this.races.find(r => r.race_id === id)?.nom ?? id; }
  situationFor(id: number) { return this.situations.find(s => s.lot_id === id); }

  openCroissance(l: Lot) {
    this.croissanceLot    = l;
    this.croissanceTableau = [];
    this.showCroissance   = true;
    this.croissanceLoading = true;
    this.croissanceSvc.getTableau(l.race_id).subscribe({
      next: data => { this.croissanceTableau = data; this.croissanceLoading = false; },
      error: () => { this.croissanceLoading = false; },
    });
  }

  openCreate() { this.editId = null; this.form = { actif: 1 }; this.showModal = true; }
  openEdit(l: Lot) { this.editId = l.lot_id!; this.form = { ...l }; this.showModal = true; }

  save() {
    this.saving = true;
    const obs = this.editId ? this.svc.update(this.editId, this.form as Lot) : this.svc.create(this.form as Lot);
    obs.subscribe({ next: () => { this.showModal = false; this.saving = false; this.load(); }, error: () => { this.saving = false; } });
  }

  confirmDelete(id: number) { this.deleteId = id; this.showConfirm = true; }
  doDelete() {
    if (!this.deleteId) return;
    this.svc.delete(this.deleteId).subscribe(() => { this.showConfirm = false; this.deleteId = null; this.load(); });
  }
}
