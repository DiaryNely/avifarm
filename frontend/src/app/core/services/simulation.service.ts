import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../constants';

export interface SimulationDateResponse { date: string; }

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private http = inject(HttpClient);
  private base = `${API_URL}/simulation`;

  getDate()            { return this.http.get<SimulationDateResponse>(this.base); }
  advance(days: number){ return this.http.post<SimulationDateResponse>(`${this.base}/advance`, { days }); }
  reset()              { return this.http.post<SimulationDateResponse>(`${this.base}/reset`, {}); }
}
