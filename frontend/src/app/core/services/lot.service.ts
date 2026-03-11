import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lot, LotSituation } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class LotService {
  private http = inject(HttpClient);
  private url = `${API_URL}/lots`;

  getAll(): Observable<Lot[]>                        { return this.http.get<Lot[]>(this.url); }
  getById(id: number): Observable<Lot>               { return this.http.get<Lot>(`${this.url}/${id}`); }
  getSituation(): Observable<LotSituation[]>         { return this.http.get<LotSituation[]>(`${this.url}/situation`); }
  getSituationAtDate(date: string): Observable<LotSituation[]> { return this.http.get<LotSituation[]>(`${this.url}/situation`, { params: { date } }); }
  getSituationById(id: number): Observable<LotSituation> { return this.http.get<LotSituation>(`${this.url}/${id}/situation`); }
  getPoidsAt(lotId: number, date: string): Observable<{ poids_moyen_g: number; jours: number; prix_vente_g: number }> {
    return this.http.get<{ poids_moyen_g: number; jours: number; prix_vente_g: number }>(`${this.url}/${lotId}/poids`, { params: { date } });
  }
  getPoidsAkoho(raceId: number, datedebutsakafo: string, datefinsakafo: string): Observable<{ poids_g: number }> {
    return this.http.get<{ poids_g: number }>(`${this.url}/poids-akoho`, { params: { raceId, datedebutsakafo, datefinsakafo } });
  }
  create(d: Lot): Observable<Lot>                    { return this.http.post<Lot>(this.url, d); }
  update(id: number, d: Lot): Observable<Lot>        { return this.http.put<Lot>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void>               { return this.http.delete<void>(`${this.url}/${id}`); }
}
