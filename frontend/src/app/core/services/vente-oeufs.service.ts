import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VenteOeufs } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class VenteOeufsService {
  private http = inject(HttpClient);
  private url = `${API_URL}/vente-oeufs`;

  getAll(): Observable<VenteOeufs[]>          { return this.http.get<VenteOeufs[]>(this.url); }
  getById(id: number): Observable<VenteOeufs> { return this.http.get<VenteOeufs>(`${this.url}/${id}`); }
  create(d: VenteOeufs): Observable<VenteOeufs>      { return this.http.post<VenteOeufs>(this.url, d); }
  update(id: number, d: VenteOeufs): Observable<VenteOeufs> { return this.http.put<VenteOeufs>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
