import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RaceService } from '../../core/services/race.service';
import { LotService } from '../../core/services/lot.service';
import { Race } from '../../core/models/models';

@Component({
  selector: 'app-poids-akoho',
  imports: [CommonModule, FormsModule],
  templateUrl: './poids-akoho.html',
  styleUrl: './poids-akoho.scss',
})
export class PoidsAkohoComponent implements OnInit {
  private raceSvc = inject(RaceService);
  private lotSvc  = inject(LotService);

  readonly Math = Math;

  races: Race[] = [];

  selectedRaceId: number | null = null;
  dateDebut = '';
  dateFin   = '';

  loading  = false;
  error    = '';
  hasResult = false;

  poidsG      = 0;
  nbJours     = 0;
  nbSemaine   = 0;
  valeurAr    = 0;
  raceNom     = '';

  ngOnInit() {
    this.raceSvc.getAll().subscribe({
      next: r => { this.races = r; },
      error: () => { this.error = 'Impossible de charger les races.'; },
    });
  }

  get isFormValid(): boolean {
    return !!this.selectedRaceId && !!this.dateDebut && !!this.dateFin
           && this.dateFin >= this.dateDebut;
  }

  calculer() {
    if (!this.isFormValid) return;
    this.loading   = true;
    this.error     = '';
    this.hasResult = false;

    this.lotSvc.getPoidsAkoho(this.selectedRaceId!, this.dateDebut, this.dateFin).subscribe({
      next: res => {
        this.poidsG    = res.poids_g;
        this.nbJours   = Math.max(0, Math.floor(
          (new Date(this.dateFin).getTime() - new Date(this.dateDebut).getTime()) / 86_400_000
        ));
        this.nbSemaine = Math.floor(this.nbJours / 7);

        const race = this.races.find(r => r.race_id === Number(this.selectedRaceId));
        this.raceNom  = race?.nom ?? '';
        this.valeurAr = Math.round(this.poidsG * (race?.prix_vente_g ?? 0));

        this.hasResult = true;
        this.loading   = false;
      },
      error: () => {
        this.error   = 'Erreur lors du calcul. Vérifiez vos paramètres.';
        this.loading = false;
      },
    });
  }

  reset() {
    this.selectedRaceId = null;
    this.dateDebut = '';
    this.dateFin   = '';
    this.hasResult = false;
    this.error     = '';
  }
}
