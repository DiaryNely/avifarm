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
  getSituationById(id: number): Observable<LotSituation> { return this.http.get<LotSituation>(`${this.url}/${id}/situation`); }
  create(d: Lot): Observable<Lot>                    { return this.http.post<Lot>(this.url, d); }
  update(id: number, d: Lot): Observable<Lot>        { return this.http.put<Lot>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void>               { return this.http.delete<void>(`${this.url}/${id}`); }
}
