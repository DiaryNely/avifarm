import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncubationService } from '../../core/services/incubation.service';
import { IncubationDetail } from '../../core/models/models';

@Component({
  selector: 'app-incubations',
  imports: [CommonModule],
  templateUrl: './incubations.html',
  styleUrl: './incubations.scss',
})
export class IncubationsComponent implements OnInit {
  private svc = inject(IncubationService);

  items: IncubationDetail[] = [];
  loading = false; error = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.svc.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les données.'; this.loading = false; },
    });
  }

  statutLabel(s: string) { return s === 'eclos' ? 'Éclos' : s === 'echoue' ? 'Échoué' : 'En cours'; }
  statutClass(s: string) { return s === 'eclos' ? 'badge-success' : s === 'echoue' ? 'badge-danger' : 'badge-info'; }
}
