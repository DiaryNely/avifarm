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
    { path: '/dashboard',     icon: 'dashboard',     label: 'Tableau de bord' },
    { path: '/races',         icon: 'pets',          label: 'Races' },
    { path: '/croissance',    icon: 'show_chart',    label: 'Croissance' },
    { path: '/lots',          icon: 'inventory_2',   label: 'Lots' },
    { path: '/situation-lots', icon: 'analytics',     label: 'Situation Lots' },
    { path: '/mortalites',    icon: 'report',        label: 'Mortalités' },
    { path: '/oeufs',         icon: 'egg',           label: 'Oeufs' },
    { path: '/incubations',   icon: 'science',       label: 'Incubations' },
    { path: '/vente-oeufs',   icon: 'sell',          label: 'Vente Oeufs' },
    { path: '/vente-poulets', icon: 'storefront',    label: 'Vente Poulets' },
    { path: '/cout-achat',    icon: 'receipt_long',  label: "Coûts d'Achat" },
    { path: '/poids-akoho',   icon: 'monitor_weight', label: 'Poids Akoho' },
  ];
}
