import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem { path: string; icon: string; label: string; }

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  @Input() collapsed = false;

  navItems: NavItem[] = [
    { path: '/dashboard',     icon: 'space_dashboard', label: 'Tableau de bord' },
    { path: '/races',         icon: 'flutter_dash',    label: 'Races' },
    { path: '/croissance',    icon: 'trending_up',     label: 'Croissance' },
    { path: '/lots',          icon: 'grain',           label: 'Lots' },
    { path: '/situation-lots', icon: 'query_stats',    label: 'Situation Lots' },
    { path: '/mortalites',    icon: 'heart_broken',    label: 'Mortalités' },
    { path: '/oeufs',         icon: 'egg_alt',         label: 'Oeufs' },
    { path: '/incubations',   icon: 'nest_cam_wired_stand', label: 'Incubations' },
    { path: '/vente-oeufs',   icon: 'shopping_basket', label: 'Vente Oeufs' },
    { path: '/vente-poulets', icon: 'store',           label: 'Vente Poulets' },
    { path: '/cout-achat',    icon: 'payments',        label: "Coûts d'Achat" },
  ];
}
