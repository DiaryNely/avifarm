import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RaceService } from '../../core/services/race.service';
import { LotService } from '../../core/services/lot.service';
import { MortaliteService } from '../../core/services/mortalite.service';
import { OeufsService } from '../../core/services/oeufs.service';
import { SimulationService } from '../../core/services/simulation.service';
import { LotSituation } from '../../core/models/models';

interface StatCard { label: string; value: number; icon: string; color: string; }

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private raceSvc  = inject(RaceService);
  private lotSvc   = inject(LotService);
  private mortSvc  = inject(MortaliteService);
  private oeufsSvc = inject(OeufsService);
  private simSvc   = inject(SimulationService);

  stats: StatCard[] = [];
  situations: LotSituation[] = [];
  selectedLotId: number | null = null;
  loading = true;
  simDate: string | null = null;
  simLoading = false;

  get selectedSit(): LotSituation | undefined {
    return this.situations.find(s => s.lot_id === +this.selectedLotId!);
  }

  quickLinks = [
    { path: '/races',         icon: 'pets',         label: 'Gérer les Races' },
    { path: '/lots',          icon: 'inventory_2',  label: 'Gérer les Lots' },
    { path: '/oeufs',         icon: 'egg',          label: 'Enregistrer les Oeufs' },
    { path: '/incubations',   icon: 'science',      label: 'Incubations' },
    { path: '/cout-achat',    icon: 'receipt_long', label: "Coûts d'Achat" },
  ];

  ngOnInit() {
    this.loadAll();
  }

  private loadAll() {
    this.loading = true;
    forkJoin({
      races:      this.raceSvc.getAll(),
      lots:       this.lotSvc.getAll(),
      morts:      this.mortSvc.getAll(),
      oeufs:      this.oeufsSvc.getAll(),
      situations: this.lotSvc.getSituation(),
      sim:        this.simSvc.getDate(),
    }).subscribe({
      next: ({ races, lots, morts, oeufs, situations, sim }) => {
        this.situations = situations;
        this.simDate = sim.date;
        if (situations.length > 0 && !this.selectedLotId)
          this.selectedLotId = situations[0].lot_id;
        this.stats = [
          { label: 'Races',          value: races.length,                           icon: 'pets',          color: 'green' },
          { label: 'Lots Total',     value: lots.length,                            icon: 'inventory_2',   color: 'blue'  },
          { label: 'Lots Actifs',    value: lots.filter(x => x.actif).length,       icon: 'check_circle',  color: 'teal'  },
          { label: 'Mortalités',     value: morts.length,                           icon: 'report',        color: 'red'   },
          { label: 'Collect. Oeufs', value: oeufs.length,                           icon: 'egg',           color: 'amber' },
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  advance(days: number) {
    this.simLoading = true;
    this.simSvc.advance(days).subscribe({
      next: () => this.loadAll(),
      error: () => { this.simLoading = false; },
      complete: () => { this.simLoading = false; },
    });
  }

  resetSim() {
    this.simLoading = true;
    this.simSvc.reset().subscribe({
      next: () => this.loadAll(),
      error: () => { this.simLoading = false; },
      complete: () => { this.simLoading = false; },
    });
  }
}
