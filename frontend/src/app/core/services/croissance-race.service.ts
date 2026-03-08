import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}
