import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CroissanceRace, CroissanceRaceTableau } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class CroissanceRaceService {
  private http = inject(HttpClient);
  private url = `${API_URL}/croissance-race`;

  getAll(): Observable<CroissanceRace[]>                         { return this.http.get<CroissanceRace[]>(this.url); }
  getByRace(raceId: number): Observable<CroissanceRace[]>        { return this.http.get<CroissanceRace[]>(`${this.url}/race/${raceId}`); }
  getTableau(raceId: number): Observable<CroissanceRaceTableau[]>{ return this.http.get<CroissanceRaceTableau[]>(`${this.url}/race/${raceId}/tableau`); }
  getById(id: number): Observable<CroissanceRace>                { return this.http.get<CroissanceRace>(`${this.url}/${id}`); }
  create(d: CroissanceRace): Observable<CroissanceRace>          { return this.http.post<CroissanceRace>(this.url, d); }
  update(id: number, d: CroissanceRace): Observable<CroissanceRace> { return this.http.put<CroissanceRace>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void>                           { return this.http.delete<void>(`${this.url}/${id}`); }

  /**
   * Retourne le poids estimé (en grammes) d'un poulet de la race donnée
   * à la date `dateFin`, sachant qu'il est entré en élevage le `dateDebut`.
   * Interpolation linéaire entre les semaines du tableau de croissance.
   */
  getPoidsAkoho(raceId: number, dateDebut: string, dateFin: string): Observable<number> {
    return this.getTableau(raceId).pipe(
      map(tableau => this._computePoids(tableau, dateDebut, dateFin))
    );
  }

  private _computePoids(
    tableau: CroissanceRaceTableau[],
    dateDebut: string,
    dateFin: string
  ): number {
    if (!tableau.length) return 0;

    const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
    const jours = Math.floor(
      (new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / MS_PAR_JOUR
    );
    if (jours < 0) return 0;

    const semaine        = Math.floor(jours / 7);
    const jourDansSemaine = jours % 7;

    const sorted = [...tableau].sort((a, b) => a.semaine - b.semaine);
    const rowCurr = sorted.find(r => r.semaine === semaine);
    const rowNext = sorted.find(r => r.semaine === semaine + 1);

    // Semaine dépasse le tableau → dernier poids connu
    if (!rowCurr) {
      return sorted[sorted.length - 1]?.poids_actuel ?? 0;
    }

    // Pas de semaine suivante ou début exact → poids direct
    if (!rowNext || jourDansSemaine === 0) {
      return rowCurr.poids_actuel;
    }

    // Interpolation linéaire entre semaine N et N+1
    return Math.round(
      rowCurr.poids_actuel +
      (jourDansSemaine / 7) * (rowNext.poids_actuel - rowCurr.poids_actuel)
    );
  }
}
