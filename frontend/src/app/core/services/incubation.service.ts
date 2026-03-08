import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incubation, IncubationDetail } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class IncubationService {
  private http = inject(HttpClient);
  private url = `${API_URL}/incubations`;

  getAll(): Observable<IncubationDetail[]> { return this.http.get<IncubationDetail[]>(this.url); }
  getById(id: number): Observable<IncubationDetail> { return this.http.get<IncubationDetail>(`${this.url}/${id}`); }
  create(d: Partial<Incubation>): Observable<Incubation> { return this.http.post<Incubation>(this.url, d); }
  enregistrerEclosion(id: number, d: { nombre_eclos: number }): Observable<{ incubation: Incubation; lot_cree: any }> {
    return this.http.post<{ incubation: Incubation; lot_cree: any }>(`${this.url}/${id}/eclosion`, d);
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
