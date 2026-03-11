import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotService } from '../../core/services/lot.service';
import { LotSituation } from '../../core/models/models';

@Component({
  selector: 'app-situation-lots',
  imports: [CommonModule, FormsModule],
  templateUrl: './situation-lots.html',
  styleUrl: './situation-lots.scss',
})
export class SituationLotsComponent implements OnInit {
  private svc = inject(LotService);

  situations: LotSituation[] = [];
  loading = false;
  error = '';
  filterDate = '';
  hasLoaded = false;

  get totalVivants(): number {
    return this.situations.reduce((s, x) => s + (x.nombre_actuel ?? 0), 0);
  }
  get totalRevenu(): number {
    return this.situations.reduce((s, x) => s + (x.revenu_vente_poulets_ar ?? 0) + (x.revenu_oeufs_ar ?? 0), 0);
  }
  get totalBenefice(): number {
    return this.situations.reduce((s, x) => s + (x.benefice_ar ?? 0), 0);
  }

  ngOnInit() {}

  loadSituations() {
    if (!this.filterDate) {
      this.situations = [];
      this.hasLoaded = false;
      return;
    }
    this.loading = true;
    this.error = '';
    this.hasLoaded = true;
    this.svc.getSituationAtDate(this.filterDate).subscribe({
      next: s => { this.situations = s; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les situations.'; this.loading = false; },
    });
  }
}
