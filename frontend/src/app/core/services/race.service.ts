import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Race } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class RaceService {
  private http = inject(HttpClient);
  private url = `${API_URL}/races`;

  getAll(): Observable<Race[]>          { return this.http.get<Race[]>(this.url); }
  getById(id: number): Observable<Race> { return this.http.get<Race>(`${this.url}/${id}`); }
  create(d: Race): Observable<Race>     { return this.http.post<Race>(this.url, d); }
  update(id: number, d: Race): Observable<Race> { return this.http.put<Race>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void>  { return this.http.delete<void>(`${this.url}/${id}`); }
}
