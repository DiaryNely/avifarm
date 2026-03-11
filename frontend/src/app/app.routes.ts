import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',     loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'races',         loadComponent: () => import('./features/races/races').then(m => m.RacesComponent) },
      { path: 'croissance',    loadComponent: () => import('./features/croissance-race/croissance-race').then(m => m.CroissanceRaceComponent) },
      { path: 'lots',          loadComponent: () => import('./features/lots/lots').then(m => m.LotsComponent) },
      { path: 'situation-lots', loadComponent: () => import('./features/situation-lots/situation-lots').then(m => m.SituationLotsComponent) },
      { path: 'mortalites',    loadComponent: () => import('./features/mortalites/mortalites').then(m => m.MortalitesComponent) },
      { path: 'oeufs',         loadComponent: () => import('./features/oeufs/oeufs').then(m => m.OeufsComponent) },
      { path: 'incubations',   loadComponent: () => import('./features/incubations/incubations').then(m => m.IncubationsComponent) },
      { path: 'vente-oeufs',   loadComponent: () => import('./features/vente-oeufs/vente-oeufs').then(m => m.VenteOeufsComponent) },
      { path: 'vente-poulets', loadComponent: () => import('./features/vente-poulets/vente-poulets').then(m => m.VentePouletsComponent) },
      { path: 'cout-achat',    loadComponent: () => import('./features/cout-achat/cout-achat').then(m => m.CoutAchatComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
