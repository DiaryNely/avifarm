import { Component, EventEmitter, Output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

const TITLES: Record<string, string> = {
  '/dashboard':     'Tableau de bord',
  '/races':         'Races',
  '/lots':          'Lots',
  '/mortalites':    'Mortalités',
  '/oeufs':         'Oeufs',
  '/incubations':   'Incubations',
  '/vente-oeufs':   'Vente des Oeufs',
  '/vente-poulets': 'Vente des Poulets',
  '/cout-achat':    "Coûts d'Achat",
};

@Component({
  selector: 'app-header',
  imports: [DatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  pageTitle = 'Tableau de bord';
  private router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.pageTitle = TITLES[e.urlAfterRedirects] ?? 'AviFarm';
      });
  }

  get now() { return new Date(); }
}
