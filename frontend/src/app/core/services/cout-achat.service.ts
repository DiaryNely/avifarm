import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CoutAchat } from '../models/models';
import { API_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class CoutAchatService {
  private http = inject(HttpClient);
  private url = `${API_URL}/cout-achat`;

  getAll(): Observable<CoutAchat[]>          { return this.http.get<CoutAchat[]>(this.url); }
  getById(id: number): Observable<CoutAchat> { return this.http.get<CoutAchat>(`${this.url}/${id}`); }
  create(d: CoutAchat): Observable<CoutAchat>      { return this.http.post<CoutAchat>(this.url, d); }
  update(id: number, d: CoutAchat): Observable<CoutAchat> { return this.http.put<CoutAchat>(`${this.url}/${id}`, d); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
