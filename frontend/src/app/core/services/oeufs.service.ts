import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnregistrementOeufs } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class OeufsService {
  private http = inject(HttpClient);
  private url = `${API_URL}/oeufs`;

  getAll(): Observable<EnregistrementOeufs[]>          { return this.http.get<EnregistrementOeufs[]>(this.url); }
  getById(id: number): Observable<EnregistrementOeufs> { return this.http.get<EnregistrementOeufs>(`${this.url}/${id}`); }
  create(d: EnregistrementOeufs): Observable<EnregistrementOeufs>      { return this.http.post<EnregistrementOeufs>(this.url, d); }
  update(id: number, d: EnregistrementOeufs): Observable<EnregistrementOeufs> { return this.http.put<EnregistrementOeufs>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
