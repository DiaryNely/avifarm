import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mortalite } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class MortaliteService {
  private http = inject(HttpClient);
  private url = `${API_URL}/mortalites`;

  getAll(): Observable<Mortalite[]>          { return this.http.get<Mortalite[]>(this.url); }
  getById(id: number): Observable<Mortalite> { return this.http.get<Mortalite>(`${this.url}/${id}`); }
  create(d: Mortalite): Observable<Mortalite>      { return this.http.post<Mortalite>(this.url, d); }
  update(id: number, d: Mortalite): Observable<Mortalite> { return this.http.put<Mortalite>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
