import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentePoulets } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class VentePouletsService {
  private http = inject(HttpClient);
  private url = `${API_URL}/vente-poulets`;

  getAll(): Observable<VentePoulets[]>          { return this.http.get<VentePoulets[]>(this.url); }
  getById(id: number): Observable<VentePoulets> { return this.http.get<VentePoulets>(`${this.url}/${id}`); }
  create(d: VentePoulets): Observable<VentePoulets>      { return this.http.post<VentePoulets>(this.url, d); }
  update(id: number, d: VentePoulets): Observable<VentePoulets> { return this.http.put<VentePoulets>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
