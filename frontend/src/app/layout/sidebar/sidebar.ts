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
    { path: '/dashboard',     icon: 'analytics',       label: 'Tableau de bord' },
    { path: '/races',         icon: 'diversity_3',     label: 'Races' },
    { path: '/croissance',    icon: 'trending_up',     label: 'Croissance' },
    { path: '/lots',          icon: 'groups',          label: 'Lots' },
    { path: '/mortalites',    icon: 'health_and_safety', label: 'Mortalités' },
    { path: '/oeufs',         icon: 'egg_alt',         label: 'Oeufs' },
    { path: '/incubations',   icon: 'nest_eco_leaf',   label: 'Incubations' },
    { path: '/vente-oeufs',   icon: 'shopping_basket', label: 'Vente Oeufs' },
    { path: '/vente-poulets', icon: 'shopping_cart',   label: 'Vente Poulets' },
    { path: '/cout-achat',    icon: 'payments',        label: "Coûts d'Achat" },
  ];
}
