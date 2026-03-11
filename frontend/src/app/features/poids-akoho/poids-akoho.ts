import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotService } from '../../core/services/lot.service';
import { RaceService } from '../../core/services/race.service';
import { Race } from '../../core/models/models';

@Component({
  selector: 'app-poids-akoho',
  imports: [CommonModule, FormsModule],
  templateUrl: './poids-akoho.html',
  styleUrl: './poids-akoho.scss',
})
export class PoidsAkohoComponent implements OnInit {
  private lotSvc  = inject(LotService);
  private raceSvc = inject(RaceService);

  races: Race[] = [];
  racesLoading = false;

  form = {
    raceId: null as number | null,
    datedebutsakafo: '',
    datefinsakafo: '',
  };

  result: number | null = null;
  calculating = false;
  error = '';

  get jours(): number | null {
    if (!this.form.datedebutsakafo || !this.form.datefinsakafo) return null;
    const ms = new Date(this.form.datefinsakafo).getTime() - new Date(this.form.datedebutsakafo).getTime();
    return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
  }

  get semaines(): number | null {
    const j = this.jours;
    return j !== null ? Math.floor(j / 7) : null;
  }

  ngOnInit() {
    this.racesLoading = true;
    this.raceSvc.getAll().subscribe({
      next: (races) => { this.races = races; this.racesLoading = false; },
      error: () => { this.error = 'Impossible de charger les races.'; this.racesLoading = false; },
    });
  }

  get canCalculate() {
    return this.form.raceId && this.form.datedebutsakafo && this.form.datefinsakafo
      && this.form.datefinsakafo >= this.form.datedebutsakafo;
  }

  calculer() {
    if (!this.canCalculate) return;
    this.calculating = true;
    this.result = null;
    this.error = '';
    this.lotSvc.getPoidsAkoho(
      this.form.raceId!,
      this.form.datedebutsakafo,
      this.form.datefinsakafo,
    ).subscribe({
      next: ({ poids_g }) => { this.result = poids_g; this.calculating = false; },
      error: (err) => {
        this.error = err?.error?.error ?? 'Erreur lors du calcul.';
        this.calculating = false;
      },
    });
  }

  reset() {
    this.form = { raceId: null, datedebutsakafo: '', datefinsakafo: '' };
    this.result = null;
    this.error = '';
  }

  raceName(id: number | null) {
    return this.races.find(r => r.race_id === id)?.nom ?? '';
  }
}
